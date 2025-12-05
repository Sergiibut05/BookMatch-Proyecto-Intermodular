import { z } from 'zod';

export const createVoteSchema = z.object({
    body: z.object({
        type: z.enum(['UP', 'DOWN']),
    }),
});

export type CreateVoteInput = z.infer<typeof createVoteSchema>['body'];
