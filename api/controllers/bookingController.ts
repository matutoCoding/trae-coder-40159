import { Request, Response } from 'express';
import { bookingDal, siteDal, billDal } from '../db/dal';
import { db } from '../db/init';
import { conflictService } from '../services/conflictService';
import { billingService } from '../services/billingService';
import type { CreateBookingRequest } from '../../shared/types';

export const bookingController = {
  async getAll(req: Request, res: Response) {
    try {
      const bookings = bookingDal.getAll();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: '获取预订列表失败' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const booking = bookingDal.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: '预订不存在' });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: '获取预订详情失败' });
    }
  },

  async checkConflict(req: Request, res: Response) {
    try {
      const { siteId, checkIn, checkOut, excludeId } = req.query as {
        siteId: string;
        checkIn: string;
        checkOut: string;
        excludeId?: string;
      };
      
      if (!siteId || !checkIn || !checkOut) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      
      const result = conflictService.checkConflict(siteId, checkIn, checkOut, excludeId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: '冲突检测失败' });
    }
  },

  async getSiteOccupancy(req: Request, res: Response) {
    try {
      const { siteId, startDate, endDate } = req.query as {
        siteId: string;
        startDate: string;
        endDate: string;
      };
      
      if (!siteId || !startDate || !endDate) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      
      const occupancy = conflictService.getSiteOccupancy(siteId, startDate, endDate);
      res.json(occupancy);
    } catch (error) {
      res.status(500).json({ error: '获取营位占用情况失败' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateBookingRequest;
      
      if (!data.siteId || !data.customerName || !data.customerPhone || !data.checkIn || !data.checkOut) {
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      if (checkOutDate <= checkInDate) {
        return res.status(400).json({ error: '退房日期必须晚于入住日期' });
      }
      
      const result = db.transaction(() => {
        const site = siteDal.getById(data.siteId);
        if (!site) {
          throw new Error('营位不存在');
        }
        
        if (site.status !== 'available') {
          throw new Error('营位不可用');
        }
        
        const conflictResult = conflictService.checkConflict(data.siteId, data.checkIn, data.checkOut);
        if (conflictResult.hasConflict) {
          throw new Error('CONFLICT');
        }
        
        const calculation = billingService.calculateBooking(
          data.checkIn,
          data.checkOut,
          site.type,
          data.hasElectricity,
          data.hasWater,
          data.hasSewer
        );
        
        const booking = bookingDal.create(data, calculation.total);
        
        const billItems = billingService.generateBillItems(calculation);
        const bill = billDal.create(booking.id, billItems, calculation.subtotal, calculation.total);
        
        return { booking, bill, calculation };
      })();
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create booking error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'CONFLICT') {
          const conflictResult = conflictService.checkConflict(
            (req.body as CreateBookingRequest).siteId,
            (req.body as CreateBookingRequest).checkIn,
            (req.body as CreateBookingRequest).checkOut
          );
          return res.status(409).json({
            error: '时段已被占用，请选择其他时段',
            conflicts: conflictResult.conflictingBookings,
          });
        }
        if (error.message === '营位不存在') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === '营位不可用') {
          return res.status(400).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: '创建预订失败' });
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const booking = bookingDal.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: '预订不存在' });
      }
      
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: '预订已取消' });
      }
      
      const cancelledBooking = bookingDal.cancel(req.params.id);
      
      if (booking.billId) {
        billDal.updateStatus(booking.billId, 'refunded');
      }
      
      res.json({
        booking: cancelledBooking,
        message: '预订已取消，时段已释放',
      });
    } catch (error) {
      res.status(500).json({ error: '取消预订失败' });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const booking = bookingDal.getById(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: '预订不存在' });
      }
      
      const updatedBooking = bookingDal.updateStatus(req.params.id, status);
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ error: '更新预订状态失败' });
    }
  },
};
