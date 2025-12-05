import { z } from 'zod';

export const createPostSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        content: z.string().min(10),
    }),
});

export const updatePostSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        content: z.string().min(10).optional(),
    }),
});

export const getPostsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    sort: z.enum(['newest', 'score', 'comments']).default('newest'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>['body'];
export type GetPostsQuery = z.infer<typeof getPostsQuerySchema>;
