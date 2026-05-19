import { Prisma } from "@prisma/client";
import * as receiptsRepo from "../repositories/paymentReceiptsRepository";

export const addPaymentReceipt = async (input: {
  invoiceId: string;
  fileUrl: string;
  fileName?: string;
  amount: number;
  paymentDate: Date;
  transactionRef?: string;
  uploadedBy?: string;
  notes?: string;
}) => {
  return receiptsRepo.createPaymentReceipt({
    invoice: { connect: { id: input.invoiceId } },
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    amount: new Prisma.Decimal(input.amount),
    paymentDate: input.paymentDate,
    transactionRef: input.transactionRef,
    uploadedByUser: input.uploadedBy ? { connect: { id: input.uploadedBy } } : undefined,
    notes: input.notes,
  } as Prisma.PaymentReceiptCreateInput);
};

export const getPaymentReceiptById = async (id: string) => {
  return receiptsRepo.getPaymentReceiptById(id);
};

export const listReceiptsByInvoiceId = async (invoiceId: string) => {
  return receiptsRepo.getReceiptsByInvoiceId(invoiceId);
};
