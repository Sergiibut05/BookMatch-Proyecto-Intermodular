import type { TradeSide, TradeStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';

export type { TradeSide, TradeStatus };

export type TradeListItem = {
  id: number;
  status: TradeStatus;
  senderId: number;
  receiverId: number;
  createdAt: Date;
  updatedAt: Date;
  /** Hasta 4 portadas de ítems del trueque (orden por id). */
  previewCovers: (string | null)[];
};

export type TradeDetailItem = {
  id: number;
  tradeId: number;
  userBookId: number;
  side: TradeSide;
  createdAt: Date;
  userBook: {
    id: number;
    title: string;
    author: string;
    coverUrl: string | null;
    owner: { id: number; fullName: string | null; avatarUrl: string | null };
  };
};

/** Datos públicos de participante; solo se envían en trueques ACCEPTED / COMPLETED. */
export type TradeParticipantPublic = {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
};

export type TradeDetail = TradeListItem & {
  message: string | null;
  expiresAt: Date | null;
  items: TradeDetailItem[];
  /** Solo en ACCEPTED / COMPLETED: contacto de emisor y receptor. */
  sender?: TradeParticipantPublic;
  receiver?: TradeParticipantPublic;
};

const tradeDetailInclude = {
  items: {
    orderBy: { id: 'asc' as const },
    include: {
      userBook: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
          owner: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
    },
  },
  sender: {
    select: { id: true, email: true, phone: true, fullName: true, avatarUrl: true },
  },
  receiver: {
    select: { id: true, email: true, phone: true, fullName: true, avatarUrl: true },
  },
} satisfies Prisma.TradeInclude;

type TradeWithDetail = Prisma.TradeGetPayload<{ include: typeof tradeDetailInclude }>;

function httpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as Error & { status: number }).status = status;
  return err;
}

/** Usuarios de scripts seed_trades.py / seed_analytics.py — receptores demo. */
function isDemoSeedFirebaseUid(firebaseUid: string): boolean {
  return firebaseUid.startsWith('trade_seed_') || firebaseUid.startsWith('seed_');
}

const demoAutoAcceptTimers = new Map<number, ReturnType<typeof setTimeout>>();

function scheduleDemoAutoAccept(tradeId: number, receiverFirebaseUid: string): void {
  const delayMs = env.TRADE_DEMO_AUTO_ACCEPT_MS;
  if (delayMs <= 0 || !isDemoSeedFirebaseUid(receiverFirebaseUid)) return;

  const prev = demoAutoAcceptTimers.get(tradeId);
  if (prev) clearTimeout(prev);

  demoAutoAcceptTimers.set(
    tradeId,
    setTimeout(() => {
      demoAutoAcceptTimers.delete(tradeId);
      void acceptTradeForDemoSeed(tradeId).catch((err) => {
        console.warn(`[trades] auto-aceptación demo fallida (trade ${tradeId}):`, err);
      });
    }, delayMs),
  );
}

/** Acepta en nombre del receptor seed; solo si sigue en PROPOSED. */
async function acceptTradeForDemoSeed(tradeId: number): Promise<void> {
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    select: {
      status: true,
      receiver: { select: { firebaseUid: true } },
    },
  });
  if (!trade || trade.status !== 'PROPOSED') return;
  if (!isDemoSeedFirebaseUid(trade.receiver.firebaseUid)) return;

  await prisma.trade.update({
    where: { id: tradeId },
    data: { status: 'ACCEPTED' },
  });
}

function toDetail(row: TradeWithDetail): TradeDetail {
  const { items, sender, receiver, ...rest } = row;

  const out: TradeDetail = {
    id: rest.id,
    status: rest.status,
    senderId: rest.senderId,
    receiverId: rest.receiverId,
    message: rest.message,
    expiresAt: rest.expiresAt,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
    previewCovers: items.slice(0, 4).map((i) => i.userBook.coverUrl),
    items: items.map((i) => ({
      id: i.id,
      tradeId: i.tradeId,
      userBookId: i.userBookId,
      side: i.side,
      createdAt: i.createdAt,
      userBook: {
        id: i.userBook.id,
        title: i.userBook.title,
        author: i.userBook.author,
        coverUrl: i.userBook.coverUrl,
        owner: {
          id: i.userBook.owner.id,
          fullName: i.userBook.owner.fullName,
          avatarUrl: i.userBook.owner.avatarUrl,
        },
      },
    })),
  };

  if (rest.status === 'ACCEPTED' || rest.status === 'COMPLETED') {
    out.sender = {
      id: sender.id,
      fullName: sender.fullName,
      avatarUrl: sender.avatarUrl,
      email: sender.email,
      phone: sender.phone,
    };
    out.receiver = {
      id: receiver.id,
      fullName: receiver.fullName,
      avatarUrl: receiver.avatarUrl,
      email: receiver.email,
      phone: receiver.phone,
    };
  }

  return out;
}

async function loadTradeForParticipant(id: number, userId: number): Promise<TradeWithDetail> {
  const trade = await prisma.trade.findFirst({
    where: {
      id,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: tradeDetailInclude,
  });
  if (!trade) {
    throw httpError(404, 'No encontrado');
  }
  return trade;
}

export async function listTradesForUser(userId: number): Promise<TradeListItem[]> {
  const rows = await prisma.trade.findMany({
    where: {
      AND: [
        { OR: [{ senderId: userId }, { receiverId: userId }] },
        { status: { not: 'CANCELLED' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        take: 4,
        orderBy: { id: 'asc' },
        select: {
          userBook: { select: { coverUrl: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    senderId: r.senderId,
    receiverId: r.receiverId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    previewCovers: r.items.map((i) => i.userBook.coverUrl),
  }));
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

  const receiver = await prisma.user.findUnique({
    where: { id: args.receiverId },
    select: { id: true, firebaseUid: true },
  });
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
    include: tradeDetailInclude,
  });

  scheduleDemoAutoAccept(trade.id, receiver.firebaseUid);

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
    include: tradeDetailInclude,
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
    include: tradeDetailInclude,
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
    include: tradeDetailInclude,
  });
  return toDetail(updated);
}

export async function completeTrade(id: number, userId: number): Promise<TradeDetail> {
  const trade = await loadTradeForParticipant(id, userId);
  if (trade.status !== 'ACCEPTED') {
    throw httpError(409, 'Transición inválida');
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of trade.items) {
      const newOwnerId = item.side === 'SENDER' ? trade.receiverId : trade.senderId;
      await tx.userBook.update({
        where: { id: item.userBookId },
        data: { ownerId: newOwnerId },
      });
    }

    return tx.trade.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: tradeDetailInclude,
    });
  });

  return toDetail(updated);
}
