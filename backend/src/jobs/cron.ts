import cron from "node-cron";
import prisma from "../config/db";
import * as invoicesService from "../services/invoicesService";
import * as notificationsService from "../services/notificationsService";
import { NotificationType } from "@prisma/client";

export const startCronJobs = () => {
  // Generate monthly invoices on the 1st
  cron.schedule("0 0 1 * *", async () => {
    const now = new Date();
    const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    await invoicesService.generateMonthlyInvoices(billingMonth);
  });

  // Overdue notifications daily at 9am
  cron.schedule("0 9 * * *", async () => {
    const now = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: now },
      },
    });

    for (const invoice of overdueInvoices) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });

      await notificationsService.createNotification({
        userId: invoice.tenantId,
        type: NotificationType.INVOICE,
        title: "Invoice overdue",
        content: "Your rent invoice is overdue. Please pay or contact your landlord.",
        invoiceId: invoice.id,
        leaseId: invoice.leaseId,
      });
    }
  });

  // Lease expiry check daily at midnight
  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    const expiredLeases = await prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
      },
    });

    for (const lease of expiredLeases) {
      await prisma.lease.update({
        where: { id: lease.id },
        data: { status: "EXPIRED" },
      });

      await prisma.property.update({
        where: { id: lease.propertyId },
        data: { status: "VACANT" },
      });

      await notificationsService.createNotification({
        userId: lease.tenantId,
        type: NotificationType.LEASE,
        title: "Lease expired",
        content: "Your lease has expired. Please contact your landlord if you wish to renew.",
        leaseId: lease.id,
      });
    }
  });
};
