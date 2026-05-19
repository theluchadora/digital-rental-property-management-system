-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum
ALTER TYPE "LeaseStatus" ADD VALUE 'DRAFT';

-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED', 'CLOSED');
ALTER TABLE "public"."maintenance_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "maintenance_requests" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "public"."MaintenanceStatus_old";
ALTER TABLE "maintenance_requests" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'INCIDENT';

-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "moveOutNoticeDate" TIMESTAMP(3),
ADD COLUMN     "moveOutNoticeNote" TEXT,
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'INITIATED',
ALTER COLUMN "moveOutDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_requests" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "lease_documents" (
    "id" UUID NOT NULL,
    "leaseId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "documentType" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_evidence" (
    "id" UUID NOT NULL,
    "maintenanceId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "propertyId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID,
    "reportedUserId" UUID,
    "reportType" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT,
    "witnesses" TEXT,
    "againstPerson" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_evidence" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lease_documents_leaseId_idx" ON "lease_documents"("leaseId");

-- CreateIndex
CREATE INDEX "lease_documents_uploadedBy_idx" ON "lease_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "maintenance_evidence_maintenanceId_idx" ON "maintenance_evidence"("maintenanceId");

-- CreateIndex
CREATE INDEX "maintenance_evidence_uploadedBy_idx" ON "maintenance_evidence"("uploadedBy");

-- CreateIndex
CREATE INDEX "announcements_ownerId_idx" ON "announcements"("ownerId");

-- CreateIndex
CREATE INDEX "announcements_propertyId_idx" ON "announcements"("propertyId");

-- CreateIndex
CREATE INDEX "incident_reports_reporterId_idx" ON "incident_reports"("reporterId");

-- CreateIndex
CREATE INDEX "incident_reports_reportedUserId_idx" ON "incident_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "incident_reports_status_idx" ON "incident_reports"("status");

-- CreateIndex
CREATE INDEX "incident_evidence_reportId_idx" ON "incident_evidence"("reportId");

-- CreateIndex
CREATE INDEX "incident_evidence_uploadedBy_idx" ON "incident_evidence"("uploadedBy");

-- AddForeignKey
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_evidence" ADD CONSTRAINT "maintenance_evidence_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_evidence" ADD CONSTRAINT "maintenance_evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_evidence" ADD CONSTRAINT "incident_evidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "incident_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_evidence" ADD CONSTRAINT "incident_evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

