/*
  Warnings:

  - Added the required column `latefee` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latefee` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "latefee" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "latefee" INTEGER NOT NULL;
