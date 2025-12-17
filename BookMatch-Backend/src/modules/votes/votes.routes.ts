import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
    createVoteSchema,
} from './votes.schema.js';
import {
    upsertVoteCtrl,
    deleteVoteCtrl,
    getUserVoteCtrl,
} from './votes.controller.js';

export const postVotesRouter = Router({ mergeParams: true });

postVotesRouter.post('/', auth, validate(createVoteSchema), upsertVoteCtrl);
postVotesRouter.delete('/', auth, deleteVoteCtrl);
postVotesRouter.get('/', auth, getUserVoteCtrl);
