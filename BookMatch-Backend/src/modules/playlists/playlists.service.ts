import { prisma } from '../../config/db.js';
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  GetPlaylistsQuery,
  AddPlaylistItemInput,
  UpdatePlaylistItemInput,
  ReorderPlaylistItemsInput,
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
