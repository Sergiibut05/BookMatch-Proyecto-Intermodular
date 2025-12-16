import type { Request, Response } from 'express';
import {
  getCatalogBooks,
  findCatalogBookById,
  createCatalogBook,
  updateCatalogBook,
  deleteCatalogBook,
  getAllCategories,
  addReview,
  deleteReview, // <--- MODIFICACIÓN: Importamos la nueva función del servicio
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
    // 1. Error: Libro no encontrado (Lanzado manualmente en el servicio)
    if (error.code === 'BOOK_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }

    // 2. Error Prisma P2002: Violación de restricción única (Ya existe reseña)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya has publicado una reseña para este libro.' });
    }

    // 3. Error Prisma P2003: Fallo de llave foránea (Usuario o Libro no existen en DB a nivel relacional)
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'No se pudo vincular la reseña. Verifica el usuario o el libro.' });
    }

    // 4. Loguear el error real en la consola del servidor para que tú lo veas
    console.error('Error al crear reseña:', error);

    res.status(500).json({ message: 'Error interno del servidor al procesar la reseña.' });
  }
}

// --- MODIFICACIÓN: NUEVO CONTROLADOR PARA BORRAR RESEÑA ---
export async function deleteReviewCtrl(req: Request, res: Response) {
  try {
    // Obtenemos el ID de la reseña desde los parámetros de la URL
    const reviewId = Number(req.params.id);
    if (Number.isNaN(reviewId)) return res.status(400).json({ message: 'ID de reseña inválido' });

    // Obtenemos el ID del usuario desde el token (inyectado por el middleware de auth)
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

    // Llamamos a la función del servicio que crearemos a continuación
    await deleteReview(reviewId, userId);
    
    res.status(200).json({ message: 'Reseña eliminada correctamente' });
  } catch (error: any) {
    // Gestionamos los errores específicos que lanzaremos desde el servicio
    if (error.code === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ message: error.message }); // 403: Prohibido
    }

    console.error('Error al borrar reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
// <--- FIN DE LA MODIFICACIÓN