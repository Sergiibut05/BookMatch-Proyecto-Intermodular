import { Router } from 'express';
import { getInventory } from './analytics.controller.js';
import { auth } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/isAdmin.js';

const router = Router();

// Protect with auth and isAdmin middleware
router.get('/inventory', auth, isAdmin, getInventory);

export default router;
