import { z } from 'zod';

const imageUrlSchema = z.string().url('La URL de la imagen no es válida');

// AÑADIDO: .strict() para rechazar campos no permitidos
const baseCatalogBookSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  author: z.string().min(1, 'El autor es requerido'),
  isbn: z.string().min(1, 'El ISBN es requerido'),
  description: z.string().max(2000, 'La descripción es demasiado larga').nullable().optional(),
  coverUrl: z.string().url('La URL de la portada no es válida').nullable().optional(),
  imageUrls: z.array(imageUrlSchema).optional(),
  price: z.number().nonnegative('El precio debe ser positivo'),
  stock: z.number().int('El stock debe ser un entero').nonnegative('El stock no puede ser negativo').optional(),
  categoryIds: z.array(z.number().int().positive('Los IDs de categoría deben ser enteros positivos')).optional(),
}).strict(); 

export const createCatalogBookSchema = baseCatalogBookSchema.extend({
  stock: z.number().int().nonnegative().default(0),
});

export const updateCatalogBookSchema = baseCatalogBookSchema.partial();

// --- Esquema para los filtros de búsqueda (GET) ---
export const getCatalogBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  search: z.string().optional(),
  
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  
  categoryId: z.coerce.number().int().positive().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  
  sortBy: z.enum([
    'newest', 
    'price_asc', 
    'price_desc', 
    'alphabetical'
  ]).default('newest'),
});

// --- Esquema para crear una Reseña ---
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'La valoración debe ser entre 1 y 5 estrellas'),
  comment: z.string().max(500, 'El comentario no puede exceder los 500 caracteres').optional(),
});

export type CreateCatalogBookInput = z.infer<typeof createCatalogBookSchema>;
export type UpdateCatalogBookInput = z.infer<typeof updateCatalogBookSchema>;
export type GetCatalogBooksQuery = z.infer<typeof getCatalogBooksQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;