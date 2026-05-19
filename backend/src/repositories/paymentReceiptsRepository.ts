import prisma from "../config/db";
import { Prisma, PaymentReceipt } from "@prisma/client";

export const createPaymentReceipt = async (
  data: Prisma.PaymentReceiptCreateInput
): Promise<PaymentReceipt> => {
  return prisma.paymentReceipt.create({ data });
};

export const getPaymentReceiptById = async (
  id: string
): Promise<PaymentReceipt | null> => {
  return prisma.paymentReceipt.findUnique({ where: { id } });
};

export const getReceiptsByInvoiceId = async (
  invoiceId: string
): Promise<PaymentReceipt[]> => {
  return prisma.paymentReceipt.findMany({
    where: { invoiceId },
    orderBy: { uploadedAt: "desc" },
  });
};
