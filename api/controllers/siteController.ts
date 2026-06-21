import { Request, Response } from 'express';
import { siteDal } from '../db/dal';
import type { CreateSiteRequest } from '../../shared/types';

export const siteController = {
  async getAll(req: Request, res: Response) {
    try {
      const sites = siteDal.getAll();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ error: '获取营位列表失败' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const site = siteDal.getById(req.params.id);
      if (!site) {
        return res.status(404).json({ error: '营位不存在' });
      }
      res.json(site);
    } catch (error) {
      res.status(500).json({ error: '获取营位详情失败' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateSiteRequest;
      
      if (!data.name || !data.code || !data.type) {
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      const existing = siteDal.getAll().find(s => s.code === data.code);
      if (existing) {
        return res.status(400).json({ error: '营位编码已存在' });
      }
      
      const site = siteDal.create(data);
      res.status(201).json(site);
    } catch (error) {
      res.status(500).json({ error: '创建营位失败' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const existing = siteDal.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: '营位不存在' });
      }
      
      const site = siteDal.update(req.params.id, req.body);
      res.json(site);
    } catch (error) {
      res.status(500).json({ error: '更新营位失败' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const existing = siteDal.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: '营位不存在' });
      }
      
      const success = siteDal.delete(req.params.id);
      if (!success) {
        return res.status(500).json({ error: '删除营位失败' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      res.status(500).json({ error: '删除营位失败' });
    }
  },
};
