import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authMiddleware } from '../middleware/auth.midddleware';

const router = Router();
const controller = new CatalogController();

router.get('/', controller.getAllBooks);
router.get('/:id', controller.getBookById);
router.post('/', authMiddleware, controller.createBook);

export default router;