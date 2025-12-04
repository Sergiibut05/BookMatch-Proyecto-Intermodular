import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    createPostSchema,
    updatePostSchema,
} from './posts.schema.js';
import {
    getPostsByForumIdCtrl,
    getPostByIdCtrl,
    createPostCtrl,
    updatePostCtrl,
    deletePostCtrl,
} from './posts.controller.js';

import { postCommentsRouter } from '../comments/comments.routes.js';
import { postVotesRouter } from '../votes/votes.routes.js';

const router = Router({ mergeParams: true });

// Montar router de comentarios
router.use('/:postId/comments', postCommentsRouter);

// Montar router de votos
router.use('/:postId/votes', postVotesRouter);

router.get('/', getPostsByForumIdCtrl);
router.get('/:id', getPostByIdCtrl);

router.post('/', auth, validate(createPostSchema), createPostCtrl);
router.patch('/:id', auth, validate(updatePostSchema), updatePostCtrl);
router.delete('/:id', auth, deletePostCtrl);

export default router;
