import type { Trade, TradeItem, TradeSide, TradeStatus } from '@prisma/client';
import { prisma } from '../../config/db.js';

export type { TradeSide, TradeStatus };

export type TradeListItem = {
  id: number;
  status: TradeStatus;
  senderId: number;
  receiverId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TradeDetail = TradeListItem & {
  items: Array<{
    id: number;
    tradeId: number;
    userBookId: number;
    side: TradeSide;
    createdAt: Date;
  }>;
};

type TradeWithItems = Trade & { items: TradeItem[] };

function httpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as Error & { status: number }).status = status;
  return err;
}

function toDetail(row: TradeWithItems): TradeDetail {
  const { items, ...rest } = row;
  return {
    ...rest,
    items: items.map((i) => ({
      id: i.id,
      tradeId: i.tradeId,
      userBookId: i.userBookId,
      side: i.side,
      createdAt: i.createdAt,
    })),
  };
}

async function loadTradeForParticipant(id: number, userId: number): Promise<TradeWithItems> {
  const trade = await prisma.trade.findFirst({
    where: {
      id,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!trade) {
    throw httpError(404, 'No encontrado');
  }
  return trade;
}

export async function listTradesForUser(userId: number): Promise<TradeListItem[]> {
  const rows = await prisma.trade.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      senderId: true,
      receiverId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows;
}

export async function getTradeByIdForUser(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  return toDetail(trade);
}

export async function createTrade(args: {
  senderId: number;
  receiverId: number;
  offeredUserBookIds: number[];
  requestedUserBookIds: number[];
}): Promise<TradeDetail> {
  if (args.senderId === args.receiverId) {
    throw httpError(409, 'No puedes proponerte un trueque a ti mismo');
  }

  const receiver = await prisma.user.findUnique({ where: { id: args.receiverId }, select: { id: true } });
  if (!receiver) {
    throw httpError(400, 'El usuario receptor no existe');
  }

  const offeredIds = [...new Set(args.offeredUserBookIds)];
  const requestedIds = [...new Set(args.requestedUserBookIds)];

  if (offeredIds.length === 0) {
    throw httpError(400, 'Debes ofrecer al menos un libro');
  }

  const offeredBooks = await prisma.userBook.findMany({
    where: { id: { in: offeredIds }, ownerId: args.senderId },
    select: { id: true },
  });
  if (offeredBooks.length !== offeredIds.length) {
    throw httpError(400, 'Algún libro ofrecido no existe o no te pertenece');
  }

  if (requestedIds.length > 0) {
    const requestedBooks = await prisma.userBook.findMany({
      where: { id: { in: requestedIds }, ownerId: args.receiverId },
      select: { id: true },
    });
    if (requestedBooks.length !== requestedIds.length) {
      throw httpError(400, 'Algún libro solicitado no existe o no pertenece al receptor');
    }
  }

  const trade = await prisma.trade.create({
    data: {
      senderId: args.senderId,
      receiverId: args.receiverId,
      items: {
        create: [
          ...offeredIds.map((userBookId) => ({
            userBookId,
            side: 'SENDER' as TradeSide,
          })),
          ...requestedIds.map((userBookId) => ({
            userBookId,
            side: 'RECEIVER' as TradeSide,
          })),
        ],
      },
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });

  return toDetail(trade);
}

export async function acceptTrade(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  if (trade.status !== 'PROPOSED') {
    throw httpError(409, 'Transición inválida');
  }
  if (trade.receiverId !== userId) {
    throw httpError(403, 'Solo el receptor puede aceptar');
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: { status: 'ACCEPTED' },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return toDetail(updated);
}

export async function rejectTrade(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  if (trade.status !== 'PROPOSED') {
    throw httpError(409, 'Transición inválida');
  }
  if (trade.receiverId !== userId) {
    throw httpError(403, 'Solo el receptor puede rechazar');
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: { status: 'REJECTED' },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return toDetail(updated);
}

export async function cancelTrade(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  if (trade.status !== 'PROPOSED') {
    throw httpError(409, 'Transición inválida');
  }
  if (trade.senderId !== userId) {
    throw httpError(403, 'Solo el emisor puede cancelar');
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return toDetail(updated);
}

export async function completeTrade(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  if (trade.status !== 'ACCEPTED') {
    throw httpError(409, 'Transición inválida');
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return toDetail(updated);
}
