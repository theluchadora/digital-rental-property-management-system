import apiClient from "@/lib/api-client";
import type { Invoice, PaymentReceipt, PaginatedResponse } from "@/types/api";

/** Trigger an authenticated download and save to disk */
async function downloadBlob(url: string, fallbackName: string) {
  const response = await apiClient.get(url, { responseType: "blob" });
  const blob = new Blob([response.data]);
  const contentDisposition = response.headers["content-disposition"] || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export const invoicesApi = {
  list: (params?: { status?: string; leaseId?: string; billingMonth?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Invoice>>("/invoices", { params }),

  getById: (id: string) =>
    apiClient.get<{ invoice: Invoice }>(`/invoices/${id}`),

  /** Tenant uploads a payment receipt (multipart) */
  uploadReceipt: (invoiceId: string, file: File, options?: { transactionRef?: string; paymentMethod?: string }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.transactionRef) formData.append("transactionRef", options.transactionRef);
    if (options?.paymentMethod) formData.append("paymentMethod", options.paymentMethod);
    return apiClient.post<{ receipt: PaymentReceipt; invoice: Invoice }>(`/invoices/${invoiceId}/receipts`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getReceiptDownloadUrl: (receiptId: string) =>
    `${apiClient.defaults.baseURL}/invoices/receipts/${receiptId}/download`,

  /** Download a payment receipt PDF/image to disk */
  downloadReceipt: (receiptId: string) =>
    downloadBlob(`/download/payment-receipt/${receiptId}`, `receipt_${receiptId}.pdf`),

  /** Owner/Admin reviews invoice payment status */
  reviewStatus: (invoiceId: string, data: { status: "PAID" | "UNPAID"; reviewNote?: string }) =>
    apiClient.put<{ invoice: Invoice }>(`/invoices/${invoiceId}/status`, data),

  /** Admin: generate monthly invoices */
  generateMonthly: (data?: { billingMonth?: string }) =>
    apiClient.post<{ message: string; billingMonth: string; generatedCount: number; skippedCount: number }>("/invoices/generate-monthly", data),
};
