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
  getPlaylistWebhookUrl,
  buildCallbackBaseUrl,
  createAiDraftPlaylist,
  triggerPlaylistWebhook,
  completeAiPlaylist,
} from './playlists.service.js';
import { getPlaylistsQuerySchema } from './playlists.schema.js';
import { env } from '../../config/env.js';

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

// ============================================================
// H1.3 · Generación IA (SCRUM-162)
// ============================================================

/**
 * POST /api/playlists/generate
 * Crea un draft (source=AI) y dispara el webhook de n8n.
 * Responde 202 con el draft para que el frontend haga polling.
 */
export async function generatePlaylistCtrl(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const webhookUrl = getPlaylistWebhookUrl();
  if (!webhookUrl) {
    console.error('[playlists:generate] N8N_WEBHOOK_PLAYLIST_URL no configurada');
    return res.status(503).json({
      message: 'Servicio de IA no configurado',
      error: 'El webhook de generación de playlists no está configurado en el backend.',
    });
  }

  try {
    // req.body ya viene validado por middleware `validate(generatePlaylistSchema)`.
    const draft = await createAiDraftPlaylist(userId, req.body);

    const callbackBaseUrl = buildCallbackBaseUrl(req.protocol, req.get('host') ?? '');

    try {
      await triggerPlaylistWebhook({
        webhookUrl,
        callbackBaseUrl,
        playlistId: draft.id,
        userId,
        input: req.body,
      });
    } catch (webhookError: any) {
      console.error('[playlists:generate] fallo al disparar n8n webhook', {
        playlistId: draft.id,
        message: webhookError?.message,
        code: webhookError?.code,
      });
      // Mantenemos el draft pero marcamos el error para UX.
      await completeAiPlaylist(draft.id, {
        status: 'error',
        errorMessage: 'No se pudo contactar con el servicio de IA.',
        items: [],
      }).catch((err) => console.error('[playlists:generate] fallback ai-complete failed', err));

      return res.status(502).json({
        message: 'No se pudo contactar con el servicio de IA',
        playlistId: draft.id,
      });
    }

    res.status(202).json({
      message: 'Generación en curso',
      playlist: draft,
      pollUrl: `/api/playlists/${draft.id}`,
    });
  } catch (error: any) {
    handleError(error, res);
  }
}

/**
 * POST /api/playlists/:id/ai-complete
 * Callback desde n8n. Protegido por `x-n8n-secret` (middleware previo
 * sólo si `N8N_CALLBACK_SECRET` está definido).
 */
export async function aiCompletePlaylistCtrl(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, 'ID de playlist');
  if (!id) return;

  // Si hay secret definido, el middleware ya lo validó. Duplicamos la
  // comprobación en dev (sin middleware) para no permitir callbacks ciegos:
  if (env.N8N_CALLBACK_SECRET) {
    const got = req.header('x-n8n-secret');
    if (got !== env.N8N_CALLBACK_SECRET) {
      return res.status(401).json({ message: 'Secret inválido' });
    }
  }

  try {
    const result = await completeAiPlaylist(id, req.body);
    res.json({
      ok: true,
      playlist: result.playlist,
      stats: result.stats,
    });
  } catch (error: any) {
    handleError(error, res);
  }
}
