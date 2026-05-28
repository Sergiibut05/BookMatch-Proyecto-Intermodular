import { Router } from 'express';
import { authOrDev } from '../../middleware/authOrDev.js';
import {
  createUserBookCtrl,
  deleteUserBookCtrl,
  getUserBookByIdCtrl,
  listMyUserBooksCtrl,
  listUserBooksCtrl,
} from './user-books.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: UserBooks
 *   description: Libros en poder de usuarios (trueque)
 */

/**
 * @swagger
 * /api/user-books:
 *   get:
 *     summary: Lista libros tradeables (público, paginado)
 *     tags: [UserBooks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: ownerId
 *         schema: { type: integer }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: condition
 *         schema: { type: string, enum: [NEW, LIKE_NEW, GOOD, ACCEPTABLE, WORN] }
 *     responses:
 *       200: { description: Lista paginada }
 *       400: { description: Query inválida }
 */
router.get('/', listUserBooksCtrl);

/**
 * @swagger
 * /api/user-books/mine:
 *   get:
 *     summary: Libros del usuario autenticado
 *     tags: [UserBooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de mis libros }
 *       401: { description: No autenticado }
 */
router.get('/mine', authOrDev, listMyUserBooksCtrl);

/**
 * @swagger
 * /api/user-books:
 *   post:
 *     summary: Añadir libro (manual o desde catalogBookId)
 *     tags: [UserBooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Payload inválido }
 *       401: { description: No autenticado }
 *       404: { description: Catálogo no encontrado }
 */
router.post('/', authOrDev, createUserBookCtrl);

/**
 * @swagger
 * /api/user-books/{id}:
 *   get:
 *     summary: Detalle de un libro de usuario
 *     tags: [UserBooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detalle }
 *       404: { description: No encontrado }
 */
router.get('/:id', getUserBookByIdCtrl);

/**
 * @swagger
 * /api/user-books/{id}:
 *   delete:
 *     summary: Eliminar libro (solo propietario)
 *     tags: [UserBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Eliminado }
 *       401: { description: No autenticado }
 *       404: { description: No encontrado }
 *       409: { description: Trueque activo }
 */
router.delete('/:id', authOrDev, deleteUserBookCtrl);

export default router;
