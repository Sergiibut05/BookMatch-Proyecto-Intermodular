import { Router } from 'express';
import { getDashboard, getTraffic } from './analytics.controller.js';
import { auth } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/isAdmin.js';

const router = Router();

// Protect with auth and isAdmin middleware
router.get('/dashboard', auth, isAdmin, getDashboard);
router.get('/traffic', auth, isAdmin, getTraffic);

export default router;
