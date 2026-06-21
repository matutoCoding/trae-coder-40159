import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const stats = dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: '获取统计数据失败' });
    }
  },

  async getTimeline(req: Request, res: Response) {
    try {
      const timeline = dashboardService.getTodayTimeline();
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ error: '获取时间线失败' });
    }
  },

  async getUpcoming(req: Request, res: Response) {
    try {
      const { days } = req.query;
      const bookings = dashboardService.getUpcomingBookings(days ? parseInt(days as string) : 7);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: '获取即将到来的预订失败' });
    }
  },
};
