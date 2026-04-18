import axios from 'axios';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  GetPlaylistsQuery,
  AddPlaylistItemInput,
  UpdatePlaylistItemInput,
  ReorderPlaylistItemsInput,
  GeneratePlaylistInput,
  AiCompletePlaylistInput,
} from './playlists.schema.js';

const playlistItemSelect = {
  id: true,
  playlistId: true,
  catalogBookId: true,
  position: true,
  status: true,
  note: true,
  addedAt: true,
  catalogBook: {
    select: {
      id: true,
      title: true,
      author: true,
      isbn: true,
      coverUrl: true,
      price: true,
    },
  },
} as const;

const playlistSelect = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  coverUrl: true,
  visibility: true,
  source: true,
  aiPrompt: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  items: {
    select: playlistItemSelect,
    orderBy: { position: 'asc' as const },
  },
  _count: { select: { items: true } },
} as const;

type PlaylistRecord = any;

function mapItem(item: any) {
  return {
    ...item,
    addedAt: item.addedAt instanceof Date ? item.addedAt.toISOString() : item.addedAt,
    catalogBook: item.catalogBook
      ? {
          ...item.catalogBook,
          price: item.catalogBook.price !== undefined && item.catalogBook.price !== null
            ? Number(item.catalogBook.price)
            : null,
        }
      : null,
  };
}

function mapPlaylist(record: PlaylistRecord) {
  const { items = [], _count, createdAt, updatedAt, deletedAt, ...rest } = record;
  return {
    ...rest,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
    deletedAt: deletedAt instanceof Date ? deletedAt.toISOString() : deletedAt,
    itemsCount: _count?.items ?? items.length,
    items: items.map(mapItem),
  };
}

function notFound(message = 'Playlist no encontrada') {
  const error: any = new Error(message);
  error.code = 'PLAYLIST_NOT_FOUND';
  return error;
}

function forbidden(message = 'No tienes permiso sobre esta playlist') {
  const error: any = new Error(message);
  error.code = 'PLAYLIST_FORBIDDEN';
  return error;
}

async function findOwnedPlaylist(playlistId: number, userId: number) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { id: true, ownerId: true, deletedAt: true },
  });

  if (!playlist || playlist.deletedAt) {
    throw notFound();
  }

  if (playlist.ownerId !== userId) {
    throw forbidden();
  }

  return playlist;
}

async function ensureCatalogBooksExist(ids: number[]) {
  if (!ids || ids.length === 0) return;

  const found = await prisma.catalogBook.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  const missing = ids.filter((id) => !found.some((book: any) => book.id === id));
  if (missing.length > 0) {
    const error: any = new Error(`Libros no encontrados: ${missing.join(', ')}`);
    error.code = 'BOOK_NOT_FOUND';
    throw error;
  }
}

async function getNextPosition(playlistId: number) {
  const last = await prisma.playlistItem.findFirst({
    where: { playlistId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

export async function listPlaylists(userId: number, query: GetPlaylistsQuery) {
  const { page, limit, search, source, visibility, sortBy } = query;

  const where: any = {
    ownerId: userId,
    deletedAt: null,
    ...(source ? { source } : {}),
    ...(visibility ? { visibility } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy: any =
    sortBy === 'alphabetical'
      ? { title: 'asc' }
      : sortBy === 'updated'
      ? { updatedAt: 'desc' }
      : { createdAt: 'desc' };

  const [total, playlists] = await prisma.$transaction([
    prisma.playlist.count({ where }),
    prisma.playlist.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        coverUrl: true,
        visibility: true,
        source: true,
        aiPrompt: true,
        shareToken: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items: playlists.map((p: any) => mapPlaylist({ ...p, items: [] })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPlaylistById(playlistId: number, userId: number) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: playlistSelect,
  });

  if (!playlist || playlist.deletedAt) {
    throw notFound();
  }

  if (playlist.ownerId !== userId && playlist.visibility !== 'PUBLIC') {
    throw forbidden();
  }

  return mapPlaylist(playlist);
}

export async function createPlaylist(userId: number, input: CreatePlaylistInput) {
  const { itemIds = [], aiPrompt, description, coverUrl, title, visibility, source } = input;

  if (itemIds.length > 0) {
    await ensureCatalogBooksExist(itemIds);
  }

  const uniqueItemIds = Array.from(new Set(itemIds));

  const created = await prisma.playlist.create({
    data: {
      ownerId: userId,
      title,
      description: description ?? null,
      coverUrl: coverUrl ?? null,
      visibility,
      source,
      aiPrompt: aiPrompt ?? null,
      ...(uniqueItemIds.length > 0
        ? {
            items: {
              create: uniqueItemIds.map((catalogBookId, index) => ({
                catalogBookId,
                position: index + 1,
              })),
            },
          }
        : {}),
    },
    select: playlistSelect,
  });

  return mapPlaylist(created);
}

export async function updatePlaylist(playlistId: number, userId: number, input: UpdatePlaylistInput) {
  await findOwnedPlaylist(playlistId, userId);

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.coverUrl !== undefined) data.coverUrl = input.coverUrl;
  if (input.visibility !== undefined) data.visibility = input.visibility;

  const updated = await prisma.playlist.update({
    where: { id: playlistId },
    data,
    select: playlistSelect,
  });

  return mapPlaylist(updated);
}

export async function softDeletePlaylist(playlistId: number, userId: number) {
  await findOwnedPlaylist(playlistId, userId);

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { deletedAt: new Date(), shareToken: null },
  });
}

export async function addPlaylistItem(
  playlistId: number,
  userId: number,
  input: AddPlaylistItemInput,
) {
  await findOwnedPlaylist(playlistId, userId);
  await ensureCatalogBooksExist([input.catalogBookId]);

  const existing = await prisma.playlistItem.findUnique({
    where: {
      playlistId_catalogBookId: {
        playlistId,
        catalogBookId: input.catalogBookId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    const error: any = new Error('El libro ya está en la playlist');
    error.code = 'ITEM_DUPLICATE';
    throw error;
  }

  const position = input.position ?? (await getNextPosition(playlistId));

  const created = await prisma.playlistItem.create({
    data: {
      playlistId,
      catalogBookId: input.catalogBookId,
      position,
      note: input.note ?? null,
    },
    select: playlistItemSelect,
  });

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { updatedAt: new Date() },
  });

  return mapItem(created);
}

export async function updatePlaylistItem(
  playlistId: number,
  itemId: number,
  userId: number,
  input: UpdatePlaylistItemInput,
) {
  await findOwnedPlaylist(playlistId, userId);

  const item = await prisma.playlistItem.findUnique({
    where: { id: itemId },
    select: { id: true, playlistId: true },
  });

  if (!item || item.playlistId !== playlistId) {
    const error: any = new Error('Item no encontrado en esta playlist');
    error.code = 'ITEM_NOT_FOUND';
    throw error;
  }

  const data: any = {};
  if (input.note !== undefined) data.note = input.note;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.playlistItem.update({
    where: { id: itemId },
    data,
    select: playlistItemSelect,
  });

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { updatedAt: new Date() },
  });

  return mapItem(updated);
}

export async function removePlaylistItem(
  playlistId: number,
  itemId: number,
  userId: number,
) {
  await findOwnedPlaylist(playlistId, userId);

  const item = await prisma.playlistItem.findUnique({
    where: { id: itemId },
    select: { id: true, playlistId: true },
  });

  if (!item || item.playlistId !== playlistId) {
    const error: any = new Error('Item no encontrado en esta playlist');
    error.code = 'ITEM_NOT_FOUND';
    throw error;
  }

  await prisma.playlistItem.delete({ where: { id: itemId } });

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { updatedAt: new Date() },
  });
}

export async function reorderPlaylistItems(
  playlistId: number,
  userId: number,
  input: ReorderPlaylistItemsInput,
) {
  await findOwnedPlaylist(playlistId, userId);

  const dbItems = await prisma.playlistItem.findMany({
    where: { playlistId },
    select: { id: true },
  });
  const dbIds = new Set(dbItems.map((i: any) => i.id));

  const inputIds = input.items.map((i) => i.itemId);
  const invalid = inputIds.filter((id) => !dbIds.has(id));
  if (invalid.length > 0) {
    const error: any = new Error(`Items no pertenecen a la playlist: ${invalid.join(', ')}`);
    error.code = 'ITEM_NOT_FOUND';
    throw error;
  }

  // Two-phase update to avoid violating @@index and keep operation atomic:
  // 1) move all items to negative positions to free the positive range
  // 2) assign the target positions
  await prisma.$transaction([
    ...input.items.map((entry) =>
      prisma.playlistItem.update({
        where: { id: entry.itemId },
        data: { position: -entry.position },
      }),
    ),
    ...input.items.map((entry) =>
      prisma.playlistItem.update({
        where: { id: entry.itemId },
        data: { position: entry.position },
      }),
    ),
    prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    }),
  ]);

  const refreshed = await prisma.playlistItem.findMany({
    where: { playlistId },
    orderBy: { position: 'asc' },
    select: playlistItemSelect,
  });

  return refreshed.map(mapItem);
}

// ============================================================
// H1.3 · Generación de playlists con IA (SCRUM-162)
// ============================================================

/**
 * Devuelve la URL del webhook de n8n para playlists si está correctamente
 * configurada. `null` en otro caso (el caller devuelve 503).
 */
export function getPlaylistWebhookUrl(): string | null {
  const url = env.N8N_WEBHOOK_PLAYLIST_URL;
  if (!url || url.includes('TU_ID_PLAYLIST')) return null;
  return url;
}

/**
 * Construye el `callbackUrl` que enviamos a n8n. Prioriza
 * `BACKEND_PUBLIC_URL` (configurable) y cae al host/protocol del request
 * original si no está seteada (útil en dev tras ngrok/tunnel).
 */
export function buildCallbackBaseUrl(reqProtocol: string, reqHost: string): string {
  if (env.BACKEND_PUBLIC_URL) return env.BACKEND_PUBLIC_URL.replace(/\/+$/, '');
  return `${reqProtocol}://${reqHost}`;
}

/**
 * Muestra de libros del catálogo que pasamos a n8n como contexto.
 * Limitada en tamaño para no desbordar el prompt del LLM.
 */
async function buildCatalogSample(limit = 60): Promise<Array<{ id: number; title: string; author: string | null }>> {
  const books = await prisma.catalogBook.findMany({
    take: limit,
    orderBy: { id: 'desc' },
    select: { id: true, title: true, author: true },
  });
  return books.map((b: any) => ({ id: b.id, title: b.title, author: b.author }));
}

/**
 * Crea una playlist en estado "borrador IA":
 *   - `source = AI`
 *   - `title = 'Generando...'`
 *   - `aiPrompt = prompt`
 *   - `visibility` según input (default PRIVATE).
 * No crea items; los rellena el callback `ai-complete`.
 */
export async function createAiDraftPlaylist(userId: number, input: GeneratePlaylistInput) {
  const created = await prisma.playlist.create({
    data: {
      ownerId: userId,
      title: 'Generando...',
      description: null,
      visibility: input.visibility,
      source: 'AI',
      aiPrompt: input.prompt,
    },
    select: playlistSelect,
  });

  return mapPlaylist(created);
}

/**
 * Dispara el webhook de n8n pasándole toda la información necesaria.
 * Fire-and-forget: lanza excepción si el POST falla, pero el caller
 * debe asumir que el usuario ya tiene un draft y puede reintentar.
 */
export async function triggerPlaylistWebhook(params: {
  webhookUrl: string;
  callbackBaseUrl: string;
  playlistId: number;
  userId: number;
  input: GeneratePlaylistInput;
}): Promise<void> {
  const { webhookUrl, callbackBaseUrl, playlistId, userId, input } = params;

  const catalogSample = await buildCatalogSample();

  const payload = {
    playlistId,
    userId,
    prompt: input.prompt,
    size: input.size ?? 8,
    genres: input.genres ?? [],
    mood: input.mood ?? null,
    language: input.language ?? null,
    catalogSample,
    callbackUrl: `${callbackBaseUrl}/api/playlists/${playlistId}/ai-complete`,
    callbackSecret: env.N8N_CALLBACK_SECRET || null,
  };

  await axios.post(webhookUrl, payload, { timeout: 10_000 });
}

/**
 * Rellena una playlist a partir del callback de n8n.
 *   - Filtra `catalogBookId` que no existan (log) y elimina duplicados.
 *   - Si `items` queda vacío o `status === 'error'`: marca como fallo en
 *     la descripción (`[AI_FAILED] …`) pero mantiene `source = AI`.
 *   - Sustituye atómicamente los items existentes (por si hay reintento).
 */
export async function completeAiPlaylist(
  playlistId: number,
  input: AiCompletePlaylistInput,
) {
  const existing = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { id: true, deletedAt: true, source: true },
  });
  if (!existing || existing.deletedAt) {
    throw notFound();
  }

  // Normalizamos IDs únicos y validamos contra el catálogo.
  const requestedIds = Array.from(new Set(input.items.map((it) => it.catalogBookId)));
  let validIds: number[] = [];
  let missingIds: number[] = [];

  if (requestedIds.length > 0) {
    const found = await prisma.catalogBook.findMany({
      where: { id: { in: requestedIds } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((b: any) => b.id));
    validIds = requestedIds.filter((id) => foundSet.has(id));
    missingIds = requestedIds.filter((id) => !foundSet.has(id));
    if (missingIds.length > 0) {
      console.warn(
        `[playlists:ai-complete] playlistId=${playlistId} descartando catalogBookIds inexistentes: ${missingIds.join(', ')}`,
      );
    }
  }

  const isFailure = input.status === 'error' || validIds.length === 0;

  // Si falla, dejamos título heurístico y descripción marcada.
  const failurePrefix = '[AI_FAILED]';
  let nextTitle = input.title?.trim() || 'Generando...';
  let nextDescription: string | null = input.description?.trim() || null;

  if (isFailure) {
    nextTitle = input.title?.trim() || 'Playlist generada (sin resultados)';
    const reason = input.errorMessage?.trim()
      || 'La IA no devolvió libros válidos del catálogo. Vuelve a intentarlo con otro prompt.';
    nextDescription = `${failurePrefix} ${reason}`;
  }

  // Ordenamos items por position si viene, si no por orden de aparición.
  const orderedItems = [...input.items]
    .filter((it) => validIds.includes(it.catalogBookId))
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));

  // Reasignamos posiciones 1..N de forma determinista.
  const itemsToCreate = orderedItems.map((it, index) => ({
    catalogBookId: it.catalogBookId,
    position: index + 1,
    note: it.note ?? null,
  }));

  // Sustitución atómica: delete previos + update metadata + create nuevos.
  await prisma.$transaction([
    prisma.playlistItem.deleteMany({ where: { playlistId } }),
    prisma.playlist.update({
      where: { id: playlistId },
      data: {
        title: nextTitle,
        description: nextDescription,
        ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      },
    }),
    ...itemsToCreate.map((it) =>
      prisma.playlistItem.create({
        data: {
          playlistId,
          catalogBookId: it.catalogBookId,
          position: it.position,
          note: it.note,
        },
      }),
    ),
  ]);

  const refreshed = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: playlistSelect,
  });

  return {
    playlist: refreshed ? mapPlaylist(refreshed) : null,
    stats: {
      requested: requestedIds.length,
      accepted: validIds.length,
      discarded: missingIds.length,
      discardedIds: missingIds,
      failure: isFailure,
    },
  };
}
