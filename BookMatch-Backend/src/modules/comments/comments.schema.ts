import { z } from 'zod';

export const createCommentSchema = z.object({
    body: z.object({
        content: z.string().min(1).max(1000),
        parentId: z.number().int().optional(),
    }),
});

export const updateCommentSchema = z.object({
    body: z.object({
        content: z.string().min(1).max(1000),
    }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];
