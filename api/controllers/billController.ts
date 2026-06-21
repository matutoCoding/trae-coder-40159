import { Request, Response } from 'express';
import { billDal } from '../db/dal';

export const billController = {
  async getAll(req: Request, res: Response) {
    try {
      const bills = billDal.getAll();
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: '获取账单列表失败' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const bill = billDal.getById(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: '账单不存在' });
      }
      
      const items = billDal.getItems(req.params.id);
      res.json({
        ...bill,
        items,
      });
    } catch (error) {
      res.status(500).json({ error: '获取账单详情失败' });
    }
  },

  async pay(req: Request, res: Response) {
    try {
      const bill = billDal.getById(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: '账单不存在' });
      }
      
      if (bill.status === 'paid') {
        return res.status(400).json({ error: '账单已支付' });
      }
      
      if (bill.status === 'refunded') {
        return res.status(400).json({ error: '账单已退款' });
      }
      
      const updatedBill = billDal.updateStatus(req.params.id, 'paid');
      res.json(updatedBill);
    } catch (error) {
      res.status(500).json({ error: '支付失败' });
    }
  },

  async refund(req: Request, res: Response) {
    try {
      const bill = billDal.getById(req.params.id);
      if (!bill) {
        return res.status(404).json({ error: '账单不存在' });
      }
      
      if (bill.status === 'refunded') {
        return res.status(400).json({ error: '账单已退款' });
      }
      
      const updatedBill = billDal.updateStatus(req.params.id, 'refunded');
      res.json(updatedBill);
    } catch (error) {
      res.status(500).json({ error: '退款失败' });
    }
  },
};
