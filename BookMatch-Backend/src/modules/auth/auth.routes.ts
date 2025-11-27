import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { firebaseAuthSchema } from '../users/users.schema.js';
import { registerCtrl, loginCtrl, forgotPasswordCtrl } from './auth.controller.js';

const router = Router();

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Email inválido" })
});

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

/**
 * @swagger
 * /api/auth/forgot password:
 *   post:
 *     summary: Envía un correo de recuperación de contraseña con plantilla personalizada
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *                 email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@gmail.com
 *     responses:
 *       200:
 *         description: Correo enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Si el correo existe, recibirás instrucciones.
 *       500:
 *         description: Error interno del servidor al enviar email
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordCtrl);

export default router;
