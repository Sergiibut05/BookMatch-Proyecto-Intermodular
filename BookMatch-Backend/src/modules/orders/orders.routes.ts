import { Router } from 'express';
import { createOrderController } from './orders.controller.js';
import { authenticate } from '../../middleware/auth.js'; 

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea un nuevo pedido y envía correo de confirmación
 *     tags: [Orders]
 *     security:
 *         bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *                 totalAmount
 *                 shippingAddress
 *                 items
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
 *                   catalogBookId:
 *                     type: integer
 *                     example: 10
 *                   quantity:
 *                     type: integer
 *                     example: 1
 *                   price:
 *                     type: number
 *                     example: 15.99
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
router.post('/', authenticate, createOrderController);

export default router;