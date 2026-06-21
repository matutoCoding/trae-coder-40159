import { Router } from 'express';
import { rateController } from '../controllers/rateController';

const router = Router();

router.get('/', rateController.getAll);
router.get('/:id', rateController.getById);
router.get('/site-type/:siteType', rateController.getBySiteType);
router.post('/calculate', rateController.calculate);
router.post('/', rateController.create);
router.put('/:id', rateController.update);
router.delete('/:id', rateController.delete);

export default router;
