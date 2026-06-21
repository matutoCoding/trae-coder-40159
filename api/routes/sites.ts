import { Router } from 'express';
import { siteController } from '../controllers/siteController';

const router = Router();

router.get('/', siteController.getAll);
router.get('/:id', siteController.getById);
router.post('/', siteController.create);
router.put('/:id', siteController.update);
router.delete('/:id', siteController.delete);

export default router;
