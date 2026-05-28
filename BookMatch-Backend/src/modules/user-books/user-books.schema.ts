import { z } from 'zod';

const bookConditionEnum = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'ACCEPTABLE', 'WORN']);

export const listUserBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  condition: bookConditionEnum.optional(),
});

export type ListUserBooksQuery = z.infer<typeof listUserBooksQuerySchema>;

export const userBookIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Crear desde catálogo (`catalogBookId`) o manual (`title` + `author`). */
export const createUserBookSchema = z
  .object({
    catalogBookId: z.number().int().positive().optional(),
    title: z.string().min(1).max(400).optional(),
    author: z.string().min(1).max(300).optional(),
    isbn: z.string().max(32).nullable().optional(),
    description: z.string().max(8000).nullable().optional(),
    coverUrl: z.string().max(2048).nullable().optional(),
    imageUrls: z.array(z.string().max(2048)).max(20).optional(),
    condition: bookConditionEnum.optional(),
    categoryIds: z.array(z.number().int().positive()).max(50).optional(),
  })
  .refine(
    (d) =>
      d.catalogBookId != null ||
      ((d.title?.length ?? 0) > 0 && (d.author?.length ?? 0) > 0),
    { message: 'Indica catalogBookId o title y author', path: ['catalogBookId'] },
  );

export type CreateUserBookInput = z.infer<typeof createUserBookSchema>;
