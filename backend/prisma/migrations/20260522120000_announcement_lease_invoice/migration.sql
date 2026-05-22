-- AlterTable
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "leaseId" UUID;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "invoiceId" UUID;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_leaseId_fkey') THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_invoiceId_fkey') THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "announcements_leaseId_idx" ON "announcements"("leaseId");
