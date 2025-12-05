import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCatalogBookSchema,
  updateCatalogBookSchema,
  createReviewSchema,
} from './catalog-books.schema.js';
import {
  getCatalogBooksCtrl, 
  getCatalogBookCtrl,
  createCatalogBookCtrl,
  updateCatalogBookCtrl,
  deleteCatalogBookCtrl,
  getCategoriesCtrl,
  addReviewCtrl,
  deleteReviewCtrl,
} from './catalog-books.controller.js';

const router = Router();

// NOTA: No usamos router.use(auth) global para dejar el GET público

/**
 * @swagger
 * tags:
 *   name: CatalogBooks
 *   description: Gestión de libros del catálogo y reseñas
 */

/**
 * @swagger
 * /api/catalog-books:
 *   get:
 *     summary: Lista libros del catálogo con filtros avanzados
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Tamaño página (default 20)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título, autor o ISBN
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, alphabetical]
 *     responses:
 *       200:
 *         description: Lista de libros
 *       400:
 *         description: Filtros inválidos
 */
router.get('/', auth, getCatalogBooksCtrl);

// --- Recuperando ruta de categorías ---
router.get('/categories', auth, getCategoriesCtrl);

/**
 * @swagger
 * /api/catalog-books/{id}:
 *   get:
 *     summary: Obtiene un libro por ID (incluyendo reseñas)
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Libro encontrado
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:id', auth, getCatalogBookCtrl);

// --- RUTAS PROTEGIDAS ---

router.post('/', auth, validate(createCatalogBookSchema), createCatalogBookCtrl);
router.patch('/:id', auth, validate(updateCatalogBookSchema), updateCatalogBookCtrl);
router.delete('/:id', auth, deleteCatalogBookCtrl);

/**
 * @swagger
 * /api/catalog-books/{id}/reviews:
 *   post:
 *     summary: Añadir una reseña a un libro
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del libro
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reseña creada
 *       409:
 *         description: El usuario ya ha reseñado este libro
 */
router.post('/:id/reviews', auth, validate(createReviewSchema), addReviewCtrl);

/**
 * @swagger
 * /api/catalog-books/reviews/{id}:
 *   delete:
 *     summary: Eliminar una reseña propia
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la reseña (NO del libro)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reseña eliminada correctamente
 *       403:
 *         description: No tienes permiso para borrar esta reseña
 *       404:
 *         description: Reseña no encontrada
 */
router.delete('/reviews/:id', auth, deleteReviewCtrl);

export default router;