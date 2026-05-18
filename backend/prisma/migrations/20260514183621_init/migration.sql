/*
  Warnings:

  - Added the required column `ownerId` to the `leases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "ownerId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
