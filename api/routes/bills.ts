import { Router } from 'express';
import { billController } from '../controllers/billController';

const router = Router();

router.get('/', billController.getAll);
router.get('/:id', billController.getById);
router.put('/:id/pay', billController.pay);
router.put('/:id/refund', billController.refund);

export default router;
