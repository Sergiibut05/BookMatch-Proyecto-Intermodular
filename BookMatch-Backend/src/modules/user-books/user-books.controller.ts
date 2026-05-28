import type { Request, Response } from 'express';
import {
  createUserBook,
  deleteUserBook,
  getUserBookById,
  listMyUserBooks,
  listTradeableUserBooks,
} from './user-books.service.js';
import {
  createUserBookSchema,
  listUserBooksQuerySchema,
  userBookIdParamSchema,
} from './user-books.schema.js';

function getUserIdOrThrow(req: Request): number {
  const id = req.user?.id;
  if (!id) {
    const err = new Error('No autorizado');
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return id;
}

function handleHttpError(res: Response, error: unknown) {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status: number }).status)
      : 500;
  const message = error instanceof Error ? error.message : 'Error';
  return res.status(status).json({ message });
}

export async function listUserBooksCtrl(req: Request, res: Response) {
  try {
    const parsed = listUserBooksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Query inválida', errors: parsed.error.flatten() });
    }
    const result = await listTradeableUserBooks(parsed.data);
    return res.json(result);
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export async function listMyUserBooksCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const items = await listMyUserBooks(userId);
    return res.json({ items });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export async function getUserBookByIdCtrl(req: Request, res: Response) {
  try {
    const parsed = userBookIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Parámetros inválidos', errors: parsed.error.flatten() });
    }
    const book = await getUserBookById(parsed.data.id);
    return res.json({ book });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export async function createUserBookCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const parsed = createUserBookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    }
    const book = await createUserBook(userId, parsed.data);
    return res.status(201).json({ book });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export async function deleteUserBookCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const parsed = userBookIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Parámetros inválidos', errors: parsed.error.flatten() });
    }
    await deleteUserBook(parsed.data.id, userId);
    return res.status(204).send();
  } catch (e) {
    return handleHttpError(res, e);
  }
}
