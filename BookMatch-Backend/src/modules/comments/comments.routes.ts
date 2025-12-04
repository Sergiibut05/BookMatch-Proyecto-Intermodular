import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    createCommentSchema,
    updateCommentSchema,
} from './comments.schema.js';
import {
    getCommentsByPostIdCtrl,
    createCommentCtrl,
    updateCommentCtrl,
    deleteCommentCtrl,
} from './comments.controller.js';

// Router para operaciones globales (/api/comments)
const router = Router();

router.patch('/:id', auth, validate(updateCommentSchema), updateCommentCtrl);
router.delete('/:id', auth, deleteCommentCtrl);

export default router;

// Router para operaciones anidadas en posts (/api/posts/:postId/comments)
export const postCommentsRouter = Router({ mergeParams: true });

postCommentsRouter.get('/', getCommentsByPostIdCtrl);
postCommentsRouter.post('/', auth, validate(createCommentSchema), createCommentCtrl);
