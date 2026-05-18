import * as invoiceRepo from "../repositories/invoicesRepository";
import * as leasesRepo from "../repositories/leasesRepository";
import * as usersRepo from "../repositories/usersRepository";
import { Invoice as DbInvoice, NotificationType } from "@prisma/client";
import * as notificationsService from "./notificationsService";
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

export const updateInvoice = async (
  id: string,
  data: InvoiceUpdateInput
): Promise<InvoiceWithOwner> => {
  const updated = await invoiceRepo.updateInvoice(id, data as any);
  return sanitize(updated);
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
