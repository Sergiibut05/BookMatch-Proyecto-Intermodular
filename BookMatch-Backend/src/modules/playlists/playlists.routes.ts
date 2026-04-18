import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistItemSchema,
  updatePlaylistItemSchema,
  reorderPlaylistItemsSchema,
} from './playlists.schema.js';
import {
  listPlaylistsCtrl,
  getPlaylistByIdCtrl,
  createPlaylistCtrl,
  updatePlaylistCtrl,
  deletePlaylistCtrl,
  addPlaylistItemCtrl,
  updatePlaylistItemCtrl,
  removePlaylistItemCtrl,
  reorderPlaylistItemsCtrl,
} from './playlists.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Gestión de playlists de libros (CRUD + items)
 */

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Lista las playlists del usuario autenticado
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string, enum: [MANUAL, AI, HYBRID] }
 *       - in: query
 *         name: visibility
 *         schema: { type: string, enum: [PRIVATE, PUBLIC] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [newest, updated, alphabetical], default: newest }
 *     responses:
 *       200: { description: Lista paginada de playlists }
 *       401: { description: No autenticado }
 */
router.get('/', auth, listPlaylistsCtrl);

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Crea una nueva playlist (opcionalmente con items iniciales)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, maxLength: 100 }
 *               description: { type: string, nullable: true, maxLength: 1000 }
 *               coverUrl: { type: string, format: uri, nullable: true }
 *               visibility: { type: string, enum: [PRIVATE, PUBLIC], default: PRIVATE }
 *               source: { type: string, enum: [MANUAL, AI, HYBRID], default: MANUAL }
 *               aiPrompt: { type: string, nullable: true }
 *               itemIds:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       201: { description: Playlist creada }
 *       400: { description: Payload inválido }
 *       401: { description: No autenticado }
 */
router.post('/', auth, validate(createPlaylistSchema), createPlaylistCtrl);

/**
 * @swagger
 * /api/playlists/{id}:
 *   get:
 *     summary: Detalle de una playlist (si es del usuario o pública)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Playlist }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.get('/:id', auth, getPlaylistByIdCtrl);

/**
 * @swagger
 * /api/playlists/{id}:
 *   patch:
 *     summary: Actualiza campos de una playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string, nullable: true }
 *               coverUrl: { type: string, format: uri, nullable: true }
 *               visibility: { type: string, enum: [PRIVATE, PUBLIC] }
 *     responses:
 *       200: { description: Playlist actualizada }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.patch('/:id', auth, validate(updatePlaylistSchema), updatePlaylistCtrl);

/**
 * @swagger
 * /api/playlists/{id}:
 *   delete:
 *     summary: Elimina (soft-delete) una playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Eliminada }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.delete('/:id', auth, deletePlaylistCtrl);

/**
 * @swagger
 * /api/playlists/{id}/items:
 *   post:
 *     summary: Añade un libro a la playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [catalogBookId]
 *             properties:
 *               catalogBookId: { type: integer }
 *               note: { type: string, nullable: true }
 *               position: { type: integer, description: "Si se omite, se añade al final" }
 *     responses:
 *       201: { description: Item añadido }
 *       400: { description: Libro no encontrado }
 *       409: { description: El libro ya está en la playlist }
 */
router.post(
  '/:id/items',
  auth,
  validate(addPlaylistItemSchema),
  addPlaylistItemCtrl,
);

/**
 * @swagger
 * /api/playlists/{id}/items/reorder:
 *   post:
 *     summary: Reordena los items de la playlist de forma atómica
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [itemId, position]
 *                   properties:
 *                     itemId: { type: integer }
 *                     position: { type: integer }
 *     responses:
 *       200: { description: Items reordenados }
 */
router.post(
  '/:id/items/reorder',
  auth,
  validate(reorderPlaylistItemsSchema),
  reorderPlaylistItemsCtrl,
);

/**
 * @swagger
 * /api/playlists/{id}/items/{itemId}:
 *   patch:
 *     summary: Actualiza una nota o estado de un item
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string, nullable: true }
 *               status: { type: string, enum: [PENDING, READING, READ] }
 *     responses:
 *       200: { description: Item actualizado }
 */
router.patch(
  '/:id/items/:itemId',
  auth,
  validate(updatePlaylistItemSchema),
  updatePlaylistItemCtrl,
);

/**
 * @swagger
 * /api/playlists/{id}/items/{itemId}:
 *   delete:
 *     summary: Elimina un item de la playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Item eliminado }
 */
router.delete('/:id/items/:itemId', auth, removePlaylistItemCtrl);

export default router;
