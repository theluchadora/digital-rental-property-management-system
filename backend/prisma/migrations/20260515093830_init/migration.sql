/*
  Warnings:

  - You are about to drop the column `isActive` on the `properties` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('VACANT', 'OCCUPIED', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "isActive",
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'VACANT';

-- DropEnum
DROP TYPE "UnitStatus";
