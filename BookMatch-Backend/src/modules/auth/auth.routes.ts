import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { firebaseAuthSchema } from '../users/users.schema.js';
import { registerCtrl, loginCtrl } from './auth.controller.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Sincroniza un usuario autenticado con Firebase
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FirebaseAuthInput'
 *     responses:
 *       201:
 *         description: Usuario sincronizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(firebaseAuthSchema), registerCtrl);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Valida un usuario autenticado con Firebase
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FirebaseAuthInput'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validate(firebaseAuthSchema), loginCtrl);

export default router;
