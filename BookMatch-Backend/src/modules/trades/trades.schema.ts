import { z } from 'zod';

export const createTradeSchema = z.object({
  receiverUserId: z.number().int().positive(),
  offeredUserBookIds: z.array(z.number().int().positive()).min(1),
  requestedUserBookIds: z.array(z.number().int().positive()).optional().default([]),
});

export const tradeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

