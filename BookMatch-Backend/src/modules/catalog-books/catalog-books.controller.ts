import type { Request, Response } from 'express';
import {
  getCatalogBooks,
  findCatalogBookById,
  createCatalogBook,
  updateCatalogBook,
  deleteCatalogBook,
  getAllCategories,
  addReview,
  deleteReview,
} from './catalog-books.service.js';
import {
  createCatalogBookSchema,
  updateCatalogBookSchema,
  getCatalogBooksQuerySchema,
} from './catalog-books.schema.js';

// --- CONTROLADOR DE FILTROS ---
export async function getCatalogBooksCtrl(req: Request, res: Response) {
  try {
    const query = getCatalogBooksQuerySchema.parse(req.query);
    const result = await getCatalogBooks(query);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Filtros inválidos', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
}

// --- CONTROLADOR DE CATEGORÍAS ---
export async function getCategoriesCtrl(req: Request, res: Response) {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener categorías' });
  }
}

// --- CRUD LIBROS ---

export async function getCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const book = await findCatalogBookById(id);
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    res.json(book);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createCatalogBookCtrl(
  req: Request<unknown, unknown, import('./catalog-books.schema.js').CreateCatalogBookInput>,
  res: Response,
) {
  try {
    const book = await createCatalogBook(req.body); 
    res.status(201).json(book);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'El ISBN ya está registrado' });
    if (error.code === 'CATEGORY_NOT_FOUND') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
}

export async function updateCatalogBookCtrl(
  req: Request<{ id: string }, unknown, import('./catalog-books.schema.js').UpdateCatalogBookInput>,
  res: Response,
) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const book = await updateCatalogBook(id, req.body);
    res.json(book);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Libro no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'El ISBN ya está registrado' });
    if (error.code === 'CATEGORY_NOT_FOUND') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
}

export async function deleteCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    await deleteCatalogBook(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Libro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

// --- CONTROLADOR DE RESEÑAS ---

export async function addReviewCtrl(req: Request, res: Response) {
  try {
    const bookId = Number(req.params.id);
    if (Number.isNaN(bookId)) return res.status(400).json({ message: 'ID de libro inválido' });

    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

    const review = await addReview(bookId, userId, req.body);
    
    res.status(201).json(review);
  } catch (error: any) {
    if (error.code === 'BOOK_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya has publicado una reseña para este libro.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'No se pudo vincular la reseña. Verifica el usuario o el libro.' });
    }
    console.error('Error al crear reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la reseña.' });
  }
}

// --- MODIFICACIÓN: CONTROLADOR ACTUALIZADO CON ROLES ---
export async function deleteReviewCtrl(req: Request, res: Response) {
  try {
    // Obtenemos el ID de la reseña
    const reviewId = Number(req.params.id);
    if (Number.isNaN(reviewId)) return res.status(400).json({ message: 'ID de reseña inválido' });

    // Obtenemos ID y ROL del usuario (inyectados por auth)
    const user = (req as any).user;
    if (!user || !user.id) return res.status(401).json({ message: 'Usuario no autenticado' });

    const userId = user.id;
    const userRole = user.role; // <-- Nuevo: Capturamos el rol

    // Llamamos al servicio pasando el rol
    await deleteReview(reviewId, userId, userRole);
    
    // 200 OK con mensaje (como tenías antes)
    res.status(200).json({ message: 'Reseña eliminada correctamente' });
  } catch (error: any) {
    if (error.code === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ message: error.message }); // 403 Forbidden para errores de permisos
    }

    console.error('Error al borrar reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
// <--- FIN DE LA MODIFICACIÓN