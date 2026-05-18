import { User } from "./user.types";
import { Lease } from "./lease.types";

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  VOID = "VOID",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CREDIT_CARD = "CREDIT_CARD",
  CHECK = "CHECK",
}

// =====================================================
// INVOICE
// =====================================================

export interface Invoice {
  id: string;
  leaseId: string;
  lease?: Lease;
  billingMonth: Date;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  paidAt?: Date | null;
  status: InvoiceStatus;
  lateFeeApplied?: number | null;
  lateFeePaid?: boolean;
  lineItems?: InvoiceLineItem[] | null;
  reviewNote?: string | null;
  reviewedAt?: Date | null;
  reviewedById?: string | null;
  reviewedBy?: User | null;
  receipts?: PaymentReceipt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoiceCreateInput {
  leaseId: string;
  billingMonth: Date;
  amountDue: number;
  dueDate: Date;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceUpdateInput {
  status?: InvoiceStatus;
  amountPaid?: number;
  paidAt?: Date;
  lateFeeApplied?: number;
  lateFeePaid?: boolean;
  reviewNote?: string;
  reviewedAt?: Date;
  reviewedById?: string;
}

// =====================================================
// PAYMENT RECEIPT
// =====================================================

export interface PaymentReceipt {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  fileUrl: string;
  cloudinaryId?: string | null;
  fileName?: string | null;
  amount: number;
  paymentDate: Date;
  paymentMethod?: PaymentMethod | null;
  transactionRef?: string | null;
  notes?: string | null;
  uploadedBy?: string | null;
  uploadedByUser?: User | null;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface PaymentReceiptCreateInput {
  invoiceId: string;
  fileUrl: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  uploadedBy?: string;
}

export interface PaymentReceiptUpdateInput {
  fileName?: string;
  cloudinaryId?: string;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}
