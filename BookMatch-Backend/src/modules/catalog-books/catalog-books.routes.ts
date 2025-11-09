import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCatalogBookSchema,
  updateCatalogBookSchema,
} from './catalog-books.schema.js';
import {
  listCatalogBooksCtrl,
  getCatalogBookCtrl,
  createCatalogBookCtrl,
  updateCatalogBookCtrl,
  deleteCatalogBookCtrl,
} from './catalog-books.controller.js';

const router = Router();

router.use(auth);

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
 *     summary: Lista libros del catálogo
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *         description: Lista de IDs de categoría separados por coma
 *     responses:
 *       200:
 *         description: Lista de libros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CatalogBook'
 *       401:
 *         description: No autorizado
 */
router.get('/', listCatalogBooksCtrl);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CatalogBook'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:id', getCatalogBookCtrl);

/**
 * @swagger
 * /api/catalog-books:
 *   post:
 *     summary: Crea un nuevo libro en el catálogo
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCatalogBookInput'
 *     responses:
 *       201:
 *         description: Libro creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CatalogBook'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: ISBN duplicado
 */
router.post('/', validate(createCatalogBookSchema), createCatalogBookCtrl);

/**
 * @swagger
 * /api/catalog-books/{id}:
 *   patch:
 *     summary: Actualiza un libro del catálogo
 *     tags: [CatalogBooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCatalogBookInput'
 *     responses:
 *       200:
 *         description: Libro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CatalogBook'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Libro no encontrado
 */
router.patch('/:id', validate(updateCatalogBookSchema), updateCatalogBookCtrl);

/**
 * @swagger
 * /api/catalog-books/{id}:
 *   delete:
 *     summary: Elimina un libro del catálogo
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
 *       204:
 *         description: Libro eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Libro no encontrado
 */
router.delete('/:id', deleteCatalogBookCtrl);

export default router;


