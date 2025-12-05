import { z } from 'zod';

export const createForumSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(100),
        description: z.string().optional(),
    }),
});

export const updateForumSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(100).optional(),
        description: z.string().optional(),
    }),
});

export const getForumsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
});

export type CreateForumInput = z.infer<typeof createForumSchema>['body'];
export type UpdateForumInput = z.infer<typeof updateForumSchema>['body'];
export type GetForumsQuery = z.infer<typeof getForumsQuerySchema>;
