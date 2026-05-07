type TradeStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
type TradeSide = 'SENDER' | 'RECEIVER';

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

let tradeSeq = 1000;
let tradeItemSeq = 5000;
const trades: TradeDetail[] = [];

function now() {
  return new Date();
}

function assertParticipantOrThrow(trade: TradeDetail, userId: number) {
  if (trade.senderId !== userId && trade.receiverId !== userId) {
    const err = new Error('Prohibido');
    // @ts-expect-error - shared error convention
    err.status = 403;
    throw err;
  }
}

function assertStatusOrThrow(trade: TradeDetail, expected: TradeStatus) {
  if (trade.status !== expected) {
    const err = new Error('Transición inválida');
    // @ts-expect-error - shared error convention
    err.status = 409;
    throw err;
  }
}

export function listTradesForUser(userId: number): TradeListItem[] {
  return trades
    .filter(t => t.senderId === userId || t.receiverId === userId)
    .map(({ items: _items, ...rest }) => rest);
}

export function getTradeByIdForUser(id: number, userId: number): TradeDetail {
  const trade = trades.find(t => t.id === id);
  if (!trade) {
    const err = new Error('No encontrado');
    // @ts-expect-error - shared error convention
    err.status = 404;
    throw err;
  }

  assertParticipantOrThrow(trade, userId);
  return trade;
}

export function createTrade(args: {
  senderId: number;
  receiverId: number;
  offeredUserBookIds: number[];
  requestedUserBookIds: number[];
}): TradeDetail {
  if (args.senderId === args.receiverId) {
    const err = new Error('No puedes proponerte un trueque a ti mismo');
    // @ts-expect-error - shared error convention
    err.status = 409;
    throw err;
  }

  const createdAt = now();
  const id = ++tradeSeq;
  const trade: TradeDetail = {
    id,
    status: 'PROPOSED',
    senderId: args.senderId,
    receiverId: args.receiverId,
    createdAt,
    updatedAt: createdAt,
    items: [],
  };

  for (const userBookId of args.offeredUserBookIds) {
    trade.items.push({
      id: ++tradeItemSeq,
      tradeId: id,
      userBookId,
      side: 'SENDER',
      createdAt,
    });
  }

  for (const userBookId of args.requestedUserBookIds) {
    trade.items.push({
      id: ++tradeItemSeq,
      tradeId: id,
      userBookId,
      side: 'RECEIVER',
      createdAt,
    });
  }

  trades.unshift(trade);
  return trade;
}

export function acceptTrade(id: number, userId: number): TradeDetail {
  const trade = getTradeByIdForUser(id, userId);
  assertStatusOrThrow(trade, 'PROPOSED');
  if (trade.receiverId !== userId) {
    const err = new Error('Solo el receptor puede aceptar');
    // @ts-expect-error - shared error convention
    err.status = 403;
    throw err;
  }
  trade.status = 'ACCEPTED';
  trade.updatedAt = now();
  return trade;
}

export function rejectTrade(id: number, userId: number): TradeDetail {
  const trade = getTradeByIdForUser(id, userId);
  assertStatusOrThrow(trade, 'PROPOSED');
  if (trade.receiverId !== userId) {
    const err = new Error('Solo el receptor puede rechazar');
    // @ts-expect-error - shared error convention
    err.status = 403;
    throw err;
  }
  trade.status = 'REJECTED';
  trade.updatedAt = now();
  return trade;
}

export function cancelTrade(id: number, userId: number): TradeDetail {
  const trade = getTradeByIdForUser(id, userId);
  assertStatusOrThrow(trade, 'PROPOSED');
  if (trade.senderId !== userId) {
    const err = new Error('Solo el emisor puede cancelar');
    // @ts-expect-error - shared error convention
    err.status = 403;
    throw err;
  }
  trade.status = 'CANCELLED';
  trade.updatedAt = now();
  return trade;
}

export function completeTrade(id: number, userId: number): TradeDetail {
  const trade = getTradeByIdForUser(id, userId);
  assertStatusOrThrow(trade, 'ACCEPTED');
  assertParticipantOrThrow(trade, userId);
  trade.status = 'COMPLETED';
  trade.updatedAt = now();
  return trade;
}

