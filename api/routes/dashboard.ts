import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/timeline', dashboardController.getTimeline);
router.get('/upcoming', dashboardController.getUpcoming);

export default router;
