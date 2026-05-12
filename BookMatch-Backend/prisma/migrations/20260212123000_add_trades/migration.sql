-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('SENDER', 'RECEIVER');

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PROPOSED',
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "id" SERIAL NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "user_book_id" INTEGER NOT NULL,
    "side" "TradeSide" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trades_sender_id_idx" ON "trades"("sender_id");

-- CreateIndex
CREATE INDEX "trades_receiver_id_idx" ON "trades"("receiver_id");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_items_trade_id_user_book_id_key" ON "trade_items"("trade_id", "user_book_id");

-- CreateIndex
CREATE INDEX "trade_items_trade_id_idx" ON "trade_items"("trade_id");

-- CreateIndex
CREATE INDEX "trade_items_user_book_id_idx" ON "trade_items"("user_book_id");

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
