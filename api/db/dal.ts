import { db } from './init';
import type { Site, Booking, Rate, Bill, BillItem, CreateSiteRequest, CreateBookingRequest, CreateRateRequest, BookingStatus, BillStatus } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const siteDal = {
  getAll(): Site[] {
    const stmt = db.prepare('SELECT * FROM sites ORDER BY code');
    return stmt.all() as Site[];
  },

  getById(id: string): Site | undefined {
    const stmt = db.prepare('SELECT * FROM sites WHERE id = ?');
    return stmt.get(id) as Site | undefined;
  },

  create(data: CreateSiteRequest): Site {
    const now = new Date().toISOString();
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO sites (id, name, code, type, hasElectricity, hasWater, hasSewer, status, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      data.code,
      data.type,
      data.hasElectricity ? 1 : 0,
      data.hasWater ? 1 : 0,
      data.hasSewer ? 1 : 0,
      data.status,
      data.description || null,
      now,
      now
    );
    return this.getById(id)!;
  },

  update(id: string, data: Partial<CreateSiteRequest>): Site | undefined {
    const now = new Date().toISOString();
    const fields = Object.entries(data)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => {
        if (k === 'hasElectricity' || k === 'hasWater' || k === 'hasSewer') {
          return `${k} = ${v ? 1 : 0}`;
        }
        return `${k} = ?`;
      });
    
    const values = Object.entries(data)
      .filter(([_, v]) => v !== undefined && typeof v !== 'boolean')
      .map(([_, v]) => v);
    
    if (fields.length === 0) return this.getById(id);
    
    fields.push('updatedAt = ?');
    values.push(now, id);
    
    const stmt = db.prepare(`UPDATE sites SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM sites WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

export const bookingDal = {
  getAll(): Booking[] {
    const stmt = db.prepare('SELECT * FROM bookings ORDER BY checkIn DESC');
    return stmt.all() as Booking[];
  },

  getById(id: string): Booking | undefined {
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    return stmt.get(id) as Booking | undefined;
  },

  getBySiteId(siteId: string): Booking[] {
    const stmt = db.prepare('SELECT * FROM bookings WHERE siteId = ? ORDER BY checkIn DESC');
    return stmt.all(siteId) as Booking[];
  },

  getByDateRange(startDate: string, endDate: string): Booking[] {
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE status != 'cancelled'
        AND checkIn < ? 
        AND checkOut > ?
      ORDER BY checkIn
    `);
    return stmt.all(endDate, startDate) as Booking[];
  },

  getConflicting(siteId: string, checkIn: string, checkOut: string, excludeId?: string): Booking[] {
    let sql = `
      SELECT * FROM bookings 
      WHERE siteId = ? 
        AND status != 'cancelled'
        AND checkIn < ? 
        AND checkOut > ?
    `;
    const params: (string | number)[] = [siteId, checkOut, checkIn];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(sql);
    return stmt.all(...params) as Booking[];
  },

  create(data: CreateBookingRequest, totalAmount: number): Booking {
    const now = new Date().toISOString();
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO bookings (id, siteId, customerName, customerPhone, checkIn, checkOut, status, hasElectricity, hasWater, hasSewer, totalAmount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.siteId,
      data.customerName,
      data.customerPhone,
      data.checkIn,
      data.checkOut,
      'confirmed',
      data.hasElectricity ? 1 : 0,
      data.hasWater ? 1 : 0,
      data.hasSewer ? 1 : 0,
      totalAmount,
      now,
      now
    );
    return this.getById(id)!;
  },

  updateStatus(id: string, status: BookingStatus): Booking | undefined {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?');
    stmt.run(status, now, id);
    return this.getById(id);
  },

  updateBillId(id: string, billId: string): void {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE bookings SET billId = ?, updatedAt = ? WHERE id = ?');
    stmt.run(billId, now, id);
  },

  cancel(id: string): Booking | undefined {
    return this.updateStatus(id, 'cancelled');
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

export const rateDal = {
  getAll(): Rate[] {
    const stmt = db.prepare('SELECT * FROM rates ORDER BY priority DESC, startDate');
    return stmt.all() as Rate[];
  },

  getById(id: string): Rate | undefined {
    const stmt = db.prepare('SELECT * FROM rates WHERE id = ?');
    return stmt.get(id) as Rate | undefined;
  },

  getBySiteType(siteType: string): Rate[] {
    const stmt = db.prepare('SELECT * FROM rates WHERE siteType = ? ORDER BY priority DESC, startDate');
    return stmt.all(siteType) as Rate[];
  },

  getApplicableRates(siteType: string, startDate: string, endDate: string): Rate[] {
    const stmt = db.prepare(`
      SELECT * FROM rates 
      WHERE siteType = ? 
        AND startDate <= ? 
        AND endDate >= ?
      ORDER BY priority DESC, startDate
    `);
    return stmt.all(siteType, endDate, startDate) as Rate[];
  },

  create(data: CreateRateRequest): Rate {
    const now = new Date().toISOString();
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO rates (id, name, type, siteType, pricePerDay, startDate, endDate, priority, electricityRate, waterRate, sewerRate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name,
      data.type,
      data.siteType,
      data.pricePerDay,
      data.startDate,
      data.endDate,
      data.priority,
      data.electricityRate,
      data.waterRate,
      data.sewerRate,
      now,
      now
    );
    return this.getById(id)!;
  },

  update(id: string, data: Partial<CreateRateRequest>): Rate | undefined {
    const now = new Date().toISOString();
    const fields = Object.keys(data)
      .filter(k => data[k as keyof CreateRateRequest] !== undefined)
      .map(k => `${k} = ?`);
    
    const values = Object.keys(data)
      .filter(k => data[k as keyof CreateRateRequest] !== undefined)
      .map(k => data[k as keyof CreateRateRequest]);
    
    if (fields.length === 0) return this.getById(id);
    
    fields.push('updatedAt = ?');
    values.push(now, id);
    
    const stmt = db.prepare(`UPDATE rates SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.getById(id);
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM rates WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

export const billDal = {
  getAll(): (Bill & { customerName: string; siteName: string })[] {
    const stmt = db.prepare(`
      SELECT b.*, bk.customerName, s.name as siteName
      FROM bills b
      JOIN bookings bk ON b.bookingId = bk.id
      JOIN sites s ON bk.siteId = s.id
      ORDER BY b.createdAt DESC
    `);
    return stmt.all() as (Bill & { customerName: string; siteName: string })[];
  },

  getById(id: string): (Bill & { customerName: string; siteName: string }) | undefined {
    const stmt = db.prepare(`
      SELECT b.*, bk.customerName, s.name as siteName
      FROM bills b
      JOIN bookings bk ON b.bookingId = bk.id
      JOIN sites s ON bk.siteId = s.id
      WHERE b.id = ?
    `);
    return stmt.get(id) as (Bill & { customerName: string; siteName: string }) | undefined;
  },

  getItems(billId: string): BillItem[] {
    const stmt = db.prepare('SELECT * FROM bill_items WHERE billId = ? ORDER BY type');
    return stmt.all(billId) as BillItem[];
  },

  create(bookingId: string, items: Omit<BillItem, 'id'>[], subtotal: number, total: number): Bill {
    const now = new Date().toISOString();
    const id = uuidv4();
    const billNumber = `BILL-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;
    
    const tx = db.transaction(() => {
      const insertBill = db.prepare(`
        INSERT INTO bills (id, bookingId, billNumber, subtotal, total, status, createdAt)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `);
      insertBill.run(id, bookingId, billNumber, subtotal, total, now);
      
      const insertItem = db.prepare(`
        INSERT INTO bill_items (id, billId, description, type, quantity, unitPrice, amount, period)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        insertItem.run(
          uuidv4(),
          id,
          item.description,
          item.type,
          item.quantity,
          item.unitPrice,
          item.amount,
          item.period || null
        );
      }
      
      bookingDal.updateBillId(bookingId, id);
    });
    
    tx();
    return this.getById(id)! as Bill;
  },

  updateStatus(id: string, status: BillStatus): Bill | undefined {
    const now = new Date().toISOString();
    const paidAt = status === 'paid' ? now : undefined;
    const stmt = db.prepare('UPDATE bills SET status = ?, paidAt = ?, updatedAt = ? WHERE id = ?');
    stmt.run(status, paidAt || null, now, id);
    return this.getById(id) as Bill | undefined;
  },
};
