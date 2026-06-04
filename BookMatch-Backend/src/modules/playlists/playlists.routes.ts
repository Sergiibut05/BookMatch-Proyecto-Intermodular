import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { env } from '../../config/env.js';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistItemSchema,
  updatePlaylistItemSchema,
  reorderPlaylistItemsSchema,
  generatePlaylistSchema,
  aiCompletePlaylistSchema,
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
  generatePlaylistCtrl,
  aiCompletePlaylistCtrl,
  sharePlaylistCtrl,
  unsharePlaylistCtrl,
  getSharedPlaylistCtrl,
  exportPlaylistCtrl,
  generatePlaylistCoverCtrl,
} from './playlists.controller.js';

/**
 * Middleware que protege el callback de n8n. Si `N8N_CALLBACK_SECRET`
 * está definido, exige el header `x-n8n-secret` exacto; si no, deja
 * pasar (modo dev sin secret configurado).
 */
function requireN8nSecret(req: Request, res: Response, next: NextFunction) {
  const secret = env.N8N_CALLBACK_SECRET;
  if (!secret) {
    console.warn('[playlists:ai-complete] N8N_CALLBACK_SECRET no configurada; aceptando callback sin autenticación');
    return next();
  }
  const got = req.header('x-n8n-secret');
  if (got !== secret) {
    return res.status(401).json({ message: 'Secret inválido' });
  }
  next();
}

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
 * /api/playlists/share/{token}:
 *   get:
 *     summary: Devuelve una playlist pública por su shareToken (sin auth).
 *     description: |
 *       Endpoint público usado por el enlace de "compartir". Solo devuelve
 *       playlists con `visibility=PUBLIC` y no eliminadas. La respuesta NO
 *       expone `ownerId`.
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string, minLength: 16 }
 *     responses:
 *       200: { description: Playlist pública }
 *       400: { description: Token inválido }
 *       404: { description: Playlist no encontrada o no compartida }
 */
router.get('/share/:token', getSharedPlaylistCtrl);

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

// ============================================================
// H1.3 · Generación IA (SCRUM-162)
// ============================================================

/**
 * @swagger
 * /api/playlists/generate:
 *   post:
 *     summary: Genera una playlist con IA (vía n8n). Crea un draft y responde 202.
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt: { type: string, minLength: 5, maxLength: 2000 }
 *               size: { type: integer, minimum: 3, maximum: 25 }
 *               genres:
 *                 type: array
 *                 items: { type: string }
 *               mood: { type: string }
 *               language: { type: string }
 *               visibility: { type: string, enum: [PRIVATE, PUBLIC], default: PRIVATE }
 *     responses:
 *       202: { description: Generación en curso; devuelve el draft para polling }
 *       400: { description: Payload inválido }
 *       401: { description: No autenticado }
 *       502: { description: No se pudo contactar con n8n }
 *       503: { description: Servicio de IA no configurado }
 */
router.post(
  '/generate',
  auth,
  validate(generatePlaylistSchema),
  generatePlaylistCtrl,
);

/**
 * @swagger
 * /api/playlists/{id}/ai-complete:
 *   post:
 *     summary: Callback desde n8n. Rellena la playlist con los resultados IA.
 *     description: Protegido por header `x-n8n-secret` (shared secret).
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: header
 *         name: x-n8n-secret
 *         required: true
 *         schema: { type: string }
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
 *               status: { type: string, enum: [success, error], default: success }
 *               errorMessage: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [catalogBookId]
 *                   properties:
 *                     catalogBookId: { type: integer }
 *                     position: { type: integer }
 *                     note: { type: string, nullable: true }
 *     responses:
 *       200: { description: Playlist actualizada; incluye stats (accepted/discarded) }
 *       401: { description: Secret inválido }
 *       404: { description: Playlist no encontrada }
 */
router.post(
  '/:id/ai-complete',
  requireN8nSecret,
  validate(aiCompletePlaylistSchema),
  aiCompletePlaylistCtrl,
);

router.post('/:id/generate-cover', auth, generatePlaylistCoverCtrl);

// ============================================================
// H1.4 · Compartir / exportar (SCRUM-163)
// ============================================================

/**
 * @swagger
 * /api/playlists/{id}/share:
 *   post:
 *     summary: Genera (o rota) el shareToken y marca la playlist como PUBLIC.
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Token generado (URL pública incluida).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 publicUrl: { type: string, format: uri }
 *                 playlist: { type: object }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.post('/:id/share', auth, sharePlaylistCtrl);

/**
 * @swagger
 * /api/playlists/{id}/share:
 *   delete:
 *     summary: Invalida el shareToken (deja de ser accesible por enlace).
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: shareToken invalidado }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.delete('/:id/share', auth, unsharePlaylistCtrl);

/**
 * @swagger
 * /api/playlists/{id}/export:
 *   get:
 *     summary: Exporta la playlist como JSON o Markdown descargable.
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, md], default: json }
 *     responses:
 *       200:
 *         description: Archivo descargable (Content-Disposition attachment).
 *       400: { description: Formato inválido }
 *       403: { description: Prohibido }
 *       404: { description: No encontrada }
 */
router.get('/:id/export', auth, exportPlaylistCtrl);

export default router;
