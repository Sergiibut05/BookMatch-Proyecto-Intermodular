import { z } from 'zod';

const visibilityEnum = z.enum(['PRIVATE', 'PUBLIC']);
const sourceEnum = z.enum(['MANUAL', 'AI', 'HYBRID']);
const itemStatusEnum = z.enum(['PENDING', 'READING', 'READ']);

export const createPlaylistSchema = z
  .object({
    title: z.string().min(1, 'El título es requerido').max(100, 'El título no puede exceder 100 caracteres'),
    description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').nullable().optional(),
    coverUrl: z.string().url('La URL de portada no es válida').nullable().optional(),
    visibility: visibilityEnum.default('PRIVATE'),
    source: sourceEnum.default('MANUAL'),
    aiPrompt: z.string().max(2000).nullable().optional(),
    itemIds: z
      .array(z.number().int().positive('Los IDs de libro deben ser enteros positivos'))
      .max(200, 'No puedes añadir más de 200 libros a la vez')
      .optional(),
  })
  .strict();

export const updatePlaylistSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
    visibility: visibilityEnum.optional(),
  })
  .strict();

export const getPlaylistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  source: sourceEnum.optional(),
  visibility: visibilityEnum.optional(),
  sortBy: z.enum(['newest', 'updated', 'alphabetical']).default('newest'),
});

export const addPlaylistItemSchema = z
  .object({
    catalogBookId: z.number().int().positive('catalogBookId inválido'),
    note: z.string().max(500).nullable().optional(),
    position: z.number().int().positive().optional(),
  })
  .strict();

export const updatePlaylistItemSchema = z
  .object({
    note: z.string().max(500).nullable().optional(),
    status: itemStatusEnum.optional(),
  })
  .strict();

export const reorderPlaylistItemsSchema = z
  .object({
    items: z
      .array(
        z.object({
          itemId: z.number().int().positive(),
          position: z.number().int().positive(),
        }),
      )
      .min(1, 'Debes indicar al menos un item'),
  })
  .strict();

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type GetPlaylistsQuery = z.infer<typeof getPlaylistsQuerySchema>;
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;
export type UpdatePlaylistItemInput = z.infer<typeof updatePlaylistItemSchema>;
export type ReorderPlaylistItemsInput = z.infer<typeof reorderPlaylistItemsSchema>;
