import { Router } from 'express';
import { createOrderController, getOrderHistoryCtrl } from './orders.controller.js';
import { auth } from '../../middleware/auth.js'; // <--- CAMBIO AQUÍ (de 'authenticate' a 'auth')
import { validate } from '../../middleware/validate.js';
import { createOrderSchema } from './orders.schema.js';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea un nuevo pedido y envía correo de confirmación
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *             - totalAmount
 *             - shippingAddress
 *             - items
 *             properties:
 *               totalAmount:
 *                 type: number
 *                 example: 25.50
 *               shippingAddress:
 *                 type: string
 *                 example: Calle Gran Vía 1, Madrid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     catalogBookId:
 *                       type: integer
 *                       example: 10
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *                     price:
 *                       type: number
 *                       example: 15.99
 *     responses:
 *       201:
 *         description: Pedido creado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderId:
 *                   type: integer
 *       400:
 *         description: Datos de validación incorrectos (Zod)
 *       401:
 *         description: No autorizado (Falta token)
 *       500:
 *         description: Error del servidor
 */
// 👇 AQUÍ TAMBIÉN CAMBIAMOS 'authenticate' POR 'auth'
router.post('/', auth, validate(createOrderSchema), createOrderController);

/**
 * @swagger
 * /api/orders/history:
 *   get:
 *     summary: Obtiene el historial de compras del usuario logueado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos recuperada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   totalAmount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *                         catalogBook:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             coverUrl:
 *                               type: string
 *       401:
 *         description: No autorizado (Falta token)
 *       500:
 *         description: Error del servidor
 */
router.get('/history', auth, getOrderHistoryCtrl);

export default router;