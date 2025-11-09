import { z } from 'zod';

const imageUrlSchema = z.string().url('La URL de la imagen no es válida');

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
});

export const createCatalogBookSchema = baseCatalogBookSchema.extend({
  stock: z.number().int().nonnegative().default(0),
});

export const updateCatalogBookSchema = baseCatalogBookSchema.partial();

export type CreateCatalogBookInput = z.infer<typeof createCatalogBookSchema>;
export type UpdateCatalogBookInput = z.infer<typeof updateCatalogBookSchema>;


