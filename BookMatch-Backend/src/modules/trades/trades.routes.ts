import { Router } from 'express';
import { authOrDev } from '../../middleware/authOrDev.js';
import {
  acceptTradeCtrl,
  cancelTradeCtrl,
  completeTradeCtrl,
  createTradeCtrl,
  getTradeByIdCtrl,
  listTradesCtrl,
  rejectTradeCtrl,
} from './trades.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Trades
 *   description: Trueques (propuestas entre usuarios)
 */

/**
 * @swagger
 * /api/trades:
 *   get:
 *     summary: Lista los trueques del usuario autenticado
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de trueques }
 *       401: { description: No autenticado }
 */
router.get('/', authOrDev, listTradesCtrl);

/**
 * @swagger
 * /api/trades:
 *   post:
 *     summary: Crea una propuesta de trueque
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverUserId, offeredUserBookIds]
 *             properties:
 *               receiverUserId: { type: integer }
 *               offeredUserBookIds: { type: array, items: { type: integer } }
 *               requestedUserBookIds: { type: array, items: { type: integer } }
 *     responses:
 *       201: { description: Trade creado }
 *       400: { description: Payload inválido }
 *       401: { description: No autenticado }
 *       409: { description: Regla de negocio (p.ej. sender=receiver) }
 */
router.post('/', authOrDev, createTradeCtrl);

/**
 * @swagger
 * /api/trades/{id}:
 *   get:
 *     summary: Detalle de un trueque
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Trade }
 *       401: { description: No autenticado }
 *       403: { description: Prohibido }
 *       404: { description: No existe }
 */
router.get('/:id', authOrDev, getTradeByIdCtrl);

router.post('/:id/accept', authOrDev, acceptTradeCtrl);
router.post('/:id/reject', authOrDev, rejectTradeCtrl);
router.post('/:id/cancel', authOrDev, cancelTradeCtrl);
router.post('/:id/complete', authOrDev, completeTradeCtrl);

export default router;

