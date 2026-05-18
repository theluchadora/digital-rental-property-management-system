/*
  Warnings:

  - The values [DRAFT] on the enum `LeaseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeaseStatus_new" AS ENUM ('ACTIVE', 'AWAITINGPAYMENT', 'EXPIRED', 'TERMINATED');
ALTER TABLE "public"."leases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leases" ALTER COLUMN "status" TYPE "LeaseStatus_new" USING ("status"::text::"LeaseStatus_new");
ALTER TYPE "LeaseStatus" RENAME TO "LeaseStatus_old";
ALTER TYPE "LeaseStatus_new" RENAME TO "LeaseStatus";
DROP TYPE "public"."LeaseStatus_old";
ALTER TABLE "leases" ALTER COLUMN "status" SET DEFAULT 'AWAITINGPAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "leases" ALTER COLUMN "status" SET DEFAULT 'AWAITINGPAYMENT';
