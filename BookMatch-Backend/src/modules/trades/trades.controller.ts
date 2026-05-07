import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  acceptTrade,
  cancelTrade,
  completeTrade,
  createTrade,
  getTradeByIdForUser,
  listTradesForUser,
  rejectTrade,
} from './trades.service.js';
import { createTradeSchema, tradeIdParamSchema } from './trades.schema.js';

function getUserIdOrThrow(req: Request): number {
  const id = req.user?.id;
  if (!id) {
    const err = new Error('No autorizado');
    // @ts-expect-error - shared error convention
    err.status = 401;
    throw err;
  }
  return id;
}

function parseIdParam(req: Request): number {
  const parsed = tradeIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const err = new Error('Parámetros inválidos');
    // @ts-expect-error - shared error convention
    err.status = 400;
    throw err;
  }
  return parsed.data.id;
}

function handleHttpError(res: Response, error: unknown) {
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as any).status) : 500;
  const message = error instanceof Error ? error.message : 'Error';
  return res.status(status).json({ message });
}

export function listTradesCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const items = listTradesForUser(userId);
    return res.json({ items });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function getTradeByIdCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const id = parseIdParam(req);
    const trade = getTradeByIdForUser(id, userId);
    return res.json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function createTradeCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const parsed = createTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    }

    const trade = createTrade({
      senderId: userId,
      receiverId: parsed.data.receiverUserId,
      offeredUserBookIds: parsed.data.offeredUserBookIds,
      requestedUserBookIds: parsed.data.requestedUserBookIds,
    });

    return res.status(201).json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function acceptTradeCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const id = parseIdParam(req);
    const trade = acceptTrade(id, userId);
    return res.json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function rejectTradeCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const id = parseIdParam(req);
    const trade = rejectTrade(id, userId);
    return res.json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function cancelTradeCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const id = parseIdParam(req);
    const trade = cancelTrade(id, userId);
    return res.json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

export function completeTradeCtrl(req: Request, res: Response) {
  try {
    const userId = getUserIdOrThrow(req);
    const id = parseIdParam(req);
    const trade = completeTrade(id, userId);
    return res.json({ trade });
  } catch (e) {
    return handleHttpError(res, e);
  }
}

