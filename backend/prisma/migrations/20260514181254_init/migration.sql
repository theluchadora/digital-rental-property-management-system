/*
  Warnings:

  - Added the required column `minLeaseMonth` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "minLeaseMonth" INTEGER NOT NULL;
