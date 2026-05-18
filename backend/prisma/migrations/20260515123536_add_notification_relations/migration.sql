/*
  Warnings:

  - You are about to drop the column `body` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `content` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_recipientId_fkey";

-- DropIndex
DROP INDEX "messages_recipientId_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "body",
DROP COLUMN "recipientId",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "receiverId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
