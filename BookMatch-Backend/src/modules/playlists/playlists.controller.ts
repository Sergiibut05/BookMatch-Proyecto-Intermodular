import type { Request, Response } from 'express';
import {
  listPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  softDeletePlaylist,
  addPlaylistItem,
  updatePlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
} from './playlists.service.js';
import { getPlaylistsQuerySchema } from './playlists.schema.js';

function requireUserId(req: Request, res: Response): number | null {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Usuario no autenticado' });
    return null;
  }
  return userId;
}

function parseIntParam(value: string | undefined, res: Response, label: string): number | null {
  const parsed = Number(value);
  if (!value || Number.isNaN(parsed) || parsed <= 0) {
    res.status(400).json({ message: `${label} inválido` });
    return null;
  }
  return parsed;
}

function handleError(error: any, res: Response, fallback = 'Error interno del servidor') {
  if (error?.code === 'PLAYLIST_NOT_FOUND' || error?.code === 'ITEM_NOT_FOUND') {
    return res.status(404).json({ message: error.message });
  }
  if (error?.code === 'PLAYLIST_FORBIDDEN') {
    return res.status(403).json({ message: error.message });
  }
  if (error?.code === 'BOOK_NOT_FOUND') {
    return res.status(400).json({ message: error.message });
  }
  if (error?.code === 'ITEM_DUPLICATE' || error?.code === 'P2002') {
    return res.status(409).json({ message: error.message || 'Conflicto de datos' });
  }
  console.error('[playlists]', error);
  return res.status(500).json({ message: fallback });
}

export async function listPlaylistsCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const query = getPlaylistsQuerySchema.parse(req.query);
    const result = await listPlaylists(userId, query);
    res.json(result);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ message: 'Filtros inválidos', errors: error.errors });
    }
    handleError(error, res);
  }
}

export async function getPlaylistByIdCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  try {
    const playlist = await getPlaylistById(id, userId);
    res.json(playlist);
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function createPlaylistCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const playlist = await createPlaylist(userId, req.body);
    res.status(201).json(playlist);
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function updatePlaylistCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  try {
    const playlist = await updatePlaylist(id, userId, req.body);
    res.json(playlist);
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function deletePlaylistCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  try {
    await softDeletePlaylist(id, userId);
    res.status(204).send();
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function addPlaylistItemCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  try {
    const item = await addPlaylistItem(id, userId, req.body);
    res.status(201).json(item);
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function updatePlaylistItemCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  const itemId = parseIntParam(req.params.itemId, res, 'ID de item');
  if (!id || !itemId) return;

  try {
    const item = await updatePlaylistItem(id, itemId, userId, req.body);
    res.json(item);
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function removePlaylistItemCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  const itemId = parseIntParam(req.params.itemId, res, 'ID de item');
  if (!id || !itemId) return;

  try {
    await removePlaylistItem(id, itemId, userId);
    res.status(204).send();
  } catch (error: any) {
    handleError(error, res);
  }
}

export async function reorderPlaylistItemsCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  try {
    const items = await reorderPlaylistItems(id, userId, req.body);
    res.json({ items });
  } catch (error: any) {
    handleError(error, res);
  }
}
