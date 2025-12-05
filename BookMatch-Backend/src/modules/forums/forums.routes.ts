import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    createForumSchema,
    updateForumSchema,
} from './forums.schema.js';
import {
    getForumsCtrl,
    getForumByIdCtrl,
    createForumCtrl,
    updateForumCtrl,
    deleteForumCtrl,
} from './forums.controller.js';

import postsRouter from '../posts/posts.routes.js';

const router = Router();

// Montar router de posts
router.use('/:forumId/posts', postsRouter);

router.get('/', getForumsCtrl);
router.get('/:id', getForumByIdCtrl);

router.post('/', auth, validate(createForumSchema), createForumCtrl);
router.patch('/:id', auth, validate(updateForumSchema), updateForumCtrl);
router.delete('/:id', auth, deleteForumCtrl);

export default router;
