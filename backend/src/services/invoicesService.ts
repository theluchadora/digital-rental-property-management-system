import * as invoiceRepo from "../repositories/invoicesRepository";
import * as leasesRepo from "../repositories/leasesRepository";
import * as usersRepo from "../repositories/usersRepository";
import { Invoice as DbInvoice, NotificationType } from "@prisma/client";
import * as notificationsService from "./notificationsService";
import { Prisma } from "@prisma/client";
import {
  InvoiceCreateInput,
  InvoiceUpdateInput,
} from "../types/invoice.types";


type SafeInvoice = DbInvoice;

type OwnerContact = {
  id: string;
  email: string;
  phoneNumber: string;
  firstName?: string | null;
  lastName?: string | null;
};

type InvoiceWithOwner = SafeInvoice & { owner?: OwnerContact };

const sanitize = async (invoice: DbInvoice): Promise<InvoiceWithOwner> => {
  const lease = await leasesRepo.getLeaseById(invoice.leaseId);
  let owner: OwnerContact | undefined;
  if (lease) {
    const user = await usersRepo.getUserById(lease.ownerId);
    if (user) {
      owner = {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
  }

  return { ...(invoice as any), owner } as InvoiceWithOwner;
};

export const createInvoice = async (
  input: InvoiceCreateInput
): Promise<InvoiceWithOwner> => {
  const lease = await leasesRepo.getLeaseById(input.leaseId);
  if (!lease) throw new Error("Lease not found");

  const created = await invoiceRepo.createInvoice({
    lease: { connect: { id: input.leaseId } } as any,
    tenant: { connect: { id: lease.tenantId } } as any,
    billingMonth: input.billingMonth,
    amountDue: input.amountDue,
    dueDate: input.dueDate,
    lineItems: input.lineItems ?? undefined,
  } as any);

  try {
    await notificationsService.createNotification({
      userId: lease.tenantId,
      type: NotificationType.INVOICE,
      title: "New invoice",
      content: `A new invoice for ${input.billingMonth.toISOString().slice(0,10)} is due ${input.dueDate.toISOString().slice(0,10)} for ${input.amountDue}`,
      invoiceId: created.id,
      leaseId: input.leaseId,
    });
  } catch (err) {
    // Log and continue
    // eslint-disable-next-line no-console
    console.error("Failed to send invoice notification", err);
  }

  return sanitize(created);
};

export const getInvoice = async (
  id: string
): Promise<InvoiceWithOwner | null> => {
  const invoice = await invoiceRepo.getInvoiceById(id);
  return invoice ? await sanitize(invoice) : null;
};

export const listInvoicesByTenant = async (
  tenantId: string
): Promise<InvoiceWithOwner[]> => {
  const invoices = await invoiceRepo.getInvoicesByUserId(tenantId);
  const enriched = await Promise.all(invoices.map((i) => sanitize(i)));
  return enriched;
};

export const listInvoices = async (
  where: Prisma.InvoiceWhereInput,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    invoiceRepo.listInvoices(where, skip, limit),
    invoiceRepo.countInvoices(where),
  ]);
  const enriched = await Promise.all(items.map((i) => sanitize(i)));

  return {
    data: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const updateInvoice = async (
  id: string,
  data: InvoiceUpdateInput
): Promise<InvoiceWithOwner> => {
  const updated = await invoiceRepo.updateInvoice(id, data as any);
  return sanitize(updated);
};

export const reviewInvoiceStatus = async (
  id: string,
  data: { status: "PAID" | "UNPAID"; reviewNote?: string; reviewerId?: string }
) => {
  const invoice = await invoiceRepo.getInvoiceById(id);
  if (!invoice) throw new Error("Invoice not found");

  const updated = await invoiceRepo.updateInvoice(id, {
    status: data.status,
    reviewNote: data.reviewNote,
    reviewedBy: data.reviewerId ? { connect: { id: data.reviewerId } } : undefined,
    reviewedAt: new Date(),
    paidAt: data.status === "PAID" ? new Date() : undefined,
  } as any);

  try {
    await notificationsService.createNotification({
      userId: invoice.tenantId,
      type: NotificationType.INVOICE,
      title: data.status === "PAID" ? "Payment confirmed" : "Payment not accepted",
      content:
        data.status === "PAID"
          ? "Your rent payment has been confirmed by the owner."
          : `Your payment receipt was not accepted.${data.reviewNote ? ` Note: ${data.reviewNote}` : ""}`,
      invoiceId: id,
      leaseId: invoice.leaseId,
    });
  } catch (err) {
    console.error("Failed to send invoice review notification", err);
  }

  return sanitize(updated);
};

export const generateMonthlyInvoices = async (billingMonth: Date) => {
  const leases = await leasesRepo.getAllLeases();
  let generatedCount = 0;
  let skippedCount = 0;

  for (const lease of leases) {
    if (lease.status !== "ACTIVE") {
      skippedCount += 1;
      continue;
    }

    const normalizedMonth = new Date(billingMonth);
    normalizedMonth.setDate(1);

    try {
      await createInvoice({
        leaseId: lease.id,
        billingMonth: normalizedMonth,
        amountDue: Number(lease.monthlyRent),
        dueDate: new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), 15),
      });
      generatedCount += 1;
    } catch {
    console.error("Error caught in invoicesService.ts:", new Error("Unknown error caught"));
      skippedCount += 1;
    }
  }

  return { generatedCount, skippedCount };
};

export const deleteInvoice = async (id: string): Promise<InvoiceWithOwner> => {
  const deleted = await invoiceRepo.deleteInvoice(id);
  return sanitize(deleted);
};


export const getownerContactForInvoice = async (invoiceId: string): Promise<OwnerContact | null> => {
  const invoice = await invoiceRepo.getInvoiceById(invoiceId);
  if (!invoice) return null;

  const lease = await leasesRepo.getLeaseById(invoice.leaseId);
  if (!lease) return null;

  const user = await usersRepo.getUserById(lease.ownerId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};
export default {
  createInvoice,
  getInvoice,
  listInvoicesByTenant,
  updateInvoice,
  deleteInvoice,
};
