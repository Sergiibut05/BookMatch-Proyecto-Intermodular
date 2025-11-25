import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCheckoutSessionSchema,
  createCheckoutSessionCartSchema,
} from './payments.schema.js';
import {
  createCheckoutSessionCtrl,
  createCheckoutSessionCartCtrl,
  getCheckoutSessionCtrl,
  paymentSuccessCtrl,
} from './payments.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestión de pagos con Stripe
 */

/**
 * @swagger
 * /api/payments/create-checkout-session:
 *   post:
 *     summary: Crea una sesión de checkout de Stripe para un libro
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: integer
 *                 description: ID del libro a comprar
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 description: Cantidad de libros
 *     responses:
 *       200:
 *         description: Sesión de checkout creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Libro no encontrado
 */
router.post(
  '/create-checkout-session',
  auth,
  validate(createCheckoutSessionSchema),
  createCheckoutSessionCtrl
);

/**
 * @swagger
 * /api/payments/create-checkout-session-cart:
 *   post:
 *     summary: Crea una sesión de checkout de Stripe para múltiples libros (carrito)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     bookId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       default: 1
 *     responses:
 *       200:
 *         description: Sesión de checkout creada
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: No autorizado
 */
router.post(
  '/create-checkout-session-cart',
  auth,
  validate(createCheckoutSessionCartSchema),
  createCheckoutSessionCartCtrl
);

/**
 * @swagger
 * /api/payments/success:
 *   get:
 *     summary: Verifica el estado de un pago exitoso y crea la Order si no existe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del pago
 */
router.get('/success', auth, paymentSuccessCtrl);

/**
 * @swagger
 * /api/payments/session/{sessionId}:
 *   get:
 *     summary: Obtiene los detalles de una sesión de checkout
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles de la sesión
 */
router.get('/session/:sessionId', auth, getCheckoutSessionCtrl);

export default router;

