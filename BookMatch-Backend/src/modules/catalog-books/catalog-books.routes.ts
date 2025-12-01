import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCatalogBookSchema,
  updateCatalogBookSchema,
} from './catalog-books.schema.js';
import {
  getCatalogBooksCtrl, // <--- NUEVO NOMBRE (listCatalogBooksCtrl ya no existe)
  getCatalogBookCtrl,
  createCatalogBookCtrl,
  updateCatalogBookCtrl,
  deleteCatalogBookCtrl,
} from './catalog-books.controller.js';

const router = Router();

// NOTA: No usamos router.use(auth) global para dejar el GET público

/**
 * @swagger
 * tags:
 *   name: CatalogBooks
 *   description: Gestión de libros del catálogo
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
 *         description: Página (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Tamaño página (default: 20)
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
router.get('/', getCatalogBooksCtrl);

/**
 * @swagger
 * /api/catalog-books/{id}:
 *   get:
 *     summary: Obtiene un libro por ID
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
router.get('/:id', getCatalogBookCtrl);

// --- RUTAS PROTEGIDAS ---

router.post('/', auth, validate(createCatalogBookSchema), createCatalogBookCtrl);
router.patch('/:id', auth, validate(updateCatalogBookSchema), updateCatalogBookCtrl);
router.delete('/:id', auth, deleteCatalogBookCtrl);

export default router;