-- CreateEnum
CREATE TYPE "BookCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'ACCEPTABLE', 'WORN');

-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "message" TEXT;

-- AlterTable
ALTER TABLE "user_books" ADD COLUMN     "catalog_book_id" INTEGER,
ADD COLUMN     "condition" "BookCondition" NOT NULL DEFAULT 'GOOD';

-- CreateIndex
CREATE INDEX "user_books_catalog_book_id_idx" ON "user_books"("catalog_book_id");

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_catalog_book_id_fkey" FOREIGN KEY ("catalog_book_id") REFERENCES "catalog_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
