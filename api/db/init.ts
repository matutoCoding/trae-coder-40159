import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campground.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  const createSitesTable = `
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('standard', 'premium', 'vip')),
      hasElectricity INTEGER NOT NULL DEFAULT 1,
      hasWater INTEGER NOT NULL DEFAULT 1,
      hasSewer INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'closed')),
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      siteId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
      hasElectricity INTEGER NOT NULL DEFAULT 1,
      hasWater INTEGER NOT NULL DEFAULT 1,
      hasSewer INTEGER NOT NULL DEFAULT 1,
      totalAmount REAL NOT NULL DEFAULT 0,
      billId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (siteId) REFERENCES sites (id)
    );
  `;

  const createBookingsIndex1 = `CREATE INDEX IF NOT EXISTS idx_bookings_site ON bookings (siteId);`;
  const createBookingsIndex2 = `CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (checkIn, checkOut);`;

  const createRatesTable = `
    CREATE TABLE IF NOT EXISTS rates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('peak', 'normal', 'off-peak')),
      siteType TEXT NOT NULL CHECK (siteType IN ('standard', 'premium', 'vip')),
      pricePerDay REAL NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      electricityRate REAL NOT NULL DEFAULT 0,
      waterRate REAL NOT NULL DEFAULT 0,
      sewerRate REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  const createBillsTable = `
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bookingId TEXT NOT NULL,
      billNumber TEXT NOT NULL UNIQUE,
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
      createdAt TEXT NOT NULL,
      paidAt TEXT,
      FOREIGN KEY (bookingId) REFERENCES bookings (id)
    );
  `;

  const createBillItemsTable = `
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      billId TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('site_fee', 'electricity', 'water', 'sewer')),
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      amount REAL NOT NULL,
      period TEXT,
      FOREIGN KEY (billId) REFERENCES bills (id)
    );
  `;

  db.exec(createSitesTable);
  db.exec(createBookingsTable);
  db.exec(createBookingsIndex1);
  db.exec(createBookingsIndex2);
  db.exec(createRatesTable);
  db.exec(createBillsTable);
  db.exec(createBillItemsTable);

  seedInitialData();
}

function seedInitialData(): void {
  const siteCount = db.prepare('SELECT COUNT(*) as count FROM sites').get() as { count: number };
  
  if (siteCount.count === 0) {
    const now = new Date().toISOString();
    
    const insertSite = db.prepare(`
      INSERT INTO sites (id, name, code, type, hasElectricity, hasWater, hasSewer, status, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sites = [
      { id: 's1', name: '标准营位 A1', code: 'A1', type: 'standard', desc: '紧邻湖边，风景优美' },
      { id: 's2', name: '标准营位 A2', code: 'A2', type: 'standard', desc: '靠近公共卫生间' },
      { id: 's3', name: '标准营位 A3', code: 'A3', type: 'standard', desc: '无下水接口' },
      { id: 's4', name: '高级营位 B1', code: 'B1', type: 'premium', desc: '独立院落，空间宽敞' },
      { id: 's5', name: '高级营位 B2', code: 'B2', type: 'premium', desc: '专属 BBQ 区域' },
      { id: 's6', name: 'VIP营位 C1', code: 'C1', type: 'vip', desc: '豪华营地，独享私密空间' },
    ];

    const insert = db.transaction(() => {
      for (const site of sites) {
        insertSite.run(
          site.id,
          site.name,
          site.code,
          site.type,
          site.type !== 'standard' ? 1 : (site.code === 'A3' ? 1 : 1),
          site.type !== 'standard' ? 1 : 1,
          site.type !== 'standard' ? 1 : (site.code === 'A3' ? 0 : 1),
          'available',
          site.desc,
          now,
          now
        );
      }
    });
    insert();

    const insertRate = db.prepare(`
      INSERT INTO rates (id, name, type, siteType, pricePerDay, startDate, endDate, priority, electricityRate, waterRate, sewerRate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const rates = [
      { id: 'r1', name: '旺季-标准', type: 'peak', siteType: 'standard', price: 180, start: '2026-07-01', end: '2026-08-31', priority: 10 },
      { id: 'r2', name: '平季-标准', type: 'normal', siteType: 'standard', price: 120, start: '2026-04-01', end: '2026-06-30', priority: 5 },
      { id: 'r3', name: '平季-标准', type: 'normal', siteType: 'standard', price: 120, start: '2026-09-01', end: '2026-10-31', priority: 5 },
      { id: 'r4', name: '淡季-标准', type: 'off-peak', siteType: 'standard', price: 80, start: '2026-01-01', end: '2026-03-31', priority: 0 },
      { id: 'r5', name: '淡季-标准', type: 'off-peak', siteType: 'standard', price: 80, start: '2026-11-01', end: '2026-12-31', priority: 0 },
      { id: 'r6', name: '旺季-高级', type: 'peak', siteType: 'premium', price: 280, start: '2026-07-01', end: '2026-08-31', priority: 10 },
      { id: 'r7', name: '平季-高级', type: 'normal', siteType: 'premium', price: 200, start: '2026-04-01', end: '2026-06-30', priority: 5 },
      { id: 'r8', name: '平季-高级', type: 'normal', siteType: 'premium', price: 200, start: '2026-09-01', end: '2026-10-31', priority: 5 },
      { id: 'r9', name: '淡季-高级', type: 'off-peak', siteType: 'premium', price: 140, start: '2026-01-01', end: '2026-03-31', priority: 0 },
      { id: 'r10', name: '淡季-高级', type: 'off-peak', siteType: 'premium', price: 140, start: '2026-11-01', end: '2026-12-31', priority: 0 },
      { id: 'r11', name: '旺季-VIP', type: 'peak', siteType: 'vip', price: 480, start: '2026-07-01', end: '2026-08-31', priority: 10 },
      { id: 'r12', name: '平季-VIP', type: 'normal', siteType: 'vip', price: 350, start: '2026-04-01', end: '2026-06-30', priority: 5 },
      { id: 'r13', name: '平季-VIP', type: 'normal', siteType: 'vip', price: 350, start: '2026-09-01', end: '2026-10-31', priority: 5 },
      { id: 'r14', name: '淡季-VIP', type: 'off-peak', siteType: 'vip', price: 250, start: '2026-01-01', end: '2026-03-31', priority: 0 },
      { id: 'r15', name: '淡季-VIP', type: 'off-peak', siteType: 'vip', price: 250, start: '2026-11-01', end: '2026-12-31', priority: 0 },
    ];

    const insertRates = db.transaction(() => {
      for (const rate of rates) {
        insertRate.run(
          rate.id,
          rate.name,
          rate.type,
          rate.siteType,
          rate.price,
          rate.start,
          rate.end,
          rate.priority,
          20,
          15,
          10,
          now,
          now
        );
      }
    });
    insertRates();

    seedSampleBookings();
  }
}

function seedSampleBookings(): void {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const nextWeek2 = new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0];

  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, siteId, customerName, customerPhone, checkIn, checkOut, status, hasElectricity, hasWater, hasSewer, totalAmount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleBookings = [
    { id: 'b1', siteId: 's1', name: '张三', phone: '13800138001', checkIn: today, checkOut: dayAfter, status: 'checked-in', amount: 360 },
    { id: 'b2', siteId: 's2', name: '李四', phone: '13800138002', checkIn: tomorrow, checkOut: nextWeek, status: 'confirmed', amount: 840 },
    { id: 'b3', siteId: 's4', name: '王五', phone: '13800138003', checkIn: today, checkOut: tomorrow, status: 'confirmed', amount: 280 },
    { id: 'b4', siteId: 's6', name: '赵六', phone: '13800138004', checkIn: nextWeek, checkOut: nextWeek2, status: 'confirmed', amount: 1500 },
  ];

  const nowStr = now.toISOString();
  const insert = db.transaction(() => {
    for (const booking of sampleBookings) {
      insertBooking.run(
        booking.id,
        booking.siteId,
        booking.name,
        booking.phone,
        booking.checkIn,
        booking.checkOut,
        booking.status,
        1, 1, 1,
        booking.amount,
        nowStr,
        nowStr
      );
    }
  });
  insert();
}

export default db;
