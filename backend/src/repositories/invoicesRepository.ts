import prisma from "../config/db";
import { Prisma, Invoice } from "@prisma/client";

//* Create a new invoice
export const createInvoice = async (
  data: Prisma.InvoiceCreateInput
): Promise<Invoice> => {
  return prisma.invoice.create({
    data,
  });
};

//* Get invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  return prisma.invoice.findUnique({
    where: { id },
  });
};

//* Get all invoices for a specific user
export const getInvoicesByUserId = async (
  tenantId: string
): Promise<Invoice[]> => {
  return prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

//* Update an invoice by ID
export const updateInvoice = async (
  id: string,
  data: Prisma.InvoiceUpdateInput
): Promise<Invoice> => {
  return prisma.invoice.update({
    where: { id },
    data,
  });
};

//* Delete an invoice by ID
export const deleteInvoice = async (id: string): Promise<Invoice> => {
  return prisma.invoice.delete({
    where: { id },
  });
};

