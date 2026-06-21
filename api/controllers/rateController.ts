import { Request, Response } from 'express';
import { rateDal } from '../db/dal';
import { billingService } from '../services/billingService';
import type { CreateRateRequest } from '../../shared/types';

export const rateController = {
  async getAll(req: Request, res: Response) {
    try {
      const rates = rateDal.getAll();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: '获取费率列表失败' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const rate = rateDal.getById(req.params.id);
      if (!rate) {
        return res.status(404).json({ error: '费率不存在' });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: '获取费率详情失败' });
    }
  },

  async getBySiteType(req: Request, res: Response) {
    try {
      const { siteType } = req.params;
      const rates = rateDal.getBySiteType(siteType);
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: '获取费率列表失败' });
    }
  },

  async calculate(req: Request, res: Response) {
    try {
      const { checkIn, checkOut, siteType, hasElectricity, hasWater, hasSewer } = req.body;
      
      if (!checkIn || !checkOut || !siteType) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      
      const calculation = billingService.calculateBooking(
        checkIn,
        checkOut,
        siteType,
        hasElectricity ?? true,
        hasWater ?? true,
        hasSewer ?? true
      );
      
      const segments = calculation.segments.map(s => ({
        ...s,
        rateTypeName: billingService.getRateTypeName(s.rate.type),
      }));
      
      res.json({
        ...calculation,
        segments,
      });
    } catch (error) {
      console.error('Calculate error:', error);
      res.status(500).json({ error: '计算费用失败' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateRateRequest;
      
      if (!data.name || !data.type || !data.siteType || !data.pricePerDay || !data.startDate || !data.endDate) {
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      const rate = rateDal.create(data);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: '创建费率失败' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const existing = rateDal.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: '费率不存在' });
      }
      
      const rate = rateDal.update(req.params.id, req.body);
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: '更新费率失败' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const existing = rateDal.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: '费率不存在' });
      }
      
      const success = rateDal.delete(req.params.id);
      if (!success) {
        return res.status(500).json({ error: '删除费率失败' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      res.status(500).json({ error: '删除费率失败' });
    }
  },
};
