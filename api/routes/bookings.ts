import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';

const router = Router();

router.get('/', bookingController.getAll);
router.get('/conflict', bookingController.checkConflict);
router.get('/occupancy', bookingController.getSiteOccupancy);
router.get('/:id', bookingController.getById);
router.post('/', bookingController.create);
router.post('/:id/cancel', bookingController.cancel);
router.put('/:id/status', bookingController.updateStatus);

export default router;
