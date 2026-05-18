import apiClient from "@/lib/api-client";
import type { Lease, LeaseDocument, PaginatedResponse } from "@/types/api";

export interface CreateLeasePayload {
  unitId: string;
  tenantId?: string;
  tenantEmail?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
}

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

export const leasesApi = {
  list: (params?: { status?: string; unitId?: string; tenantId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Lease>>("/leases", { params }),

  getById: (id: string) =>
    apiClient.get<{ lease: Lease }>(`/leases/${id}`),

  create: (data: CreateLeasePayload) =>
    apiClient.post<{ lease: Lease }>("/leases", data),

  /** Upload signed lease document — activates the lease on first signed doc */
  uploadDocument: (leaseId: string, file: File, documentType?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (documentType) formData.append("documentType", documentType);
    return apiClient.post<{ document: LeaseDocument; lease: Lease }>(`/leases/${leaseId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getDocumentDownloadUrl: (documentId: string) =>
    `${apiClient.defaults.baseURL}/leases/documents/${documentId}/download`,

  /** Authenticated download of a lease document PDF */
  downloadDocument: (documentId: string, filename?: string) =>
    downloadBlob(`/download/lease-document/${documentId}`, filename || `lease_document_${documentId}.pdf`),

  /** Tenant terminates their own lease */
  terminate: (leaseId: string, data: { reason: string }) =>
    apiClient.post<{ lease: Lease }>(`/leases/${leaseId}/terminate`, data),

  /** Tenant submits move-out notice */
  submitMoveOutNotice: (leaseId: string, data: { noticeDate: string; note?: string }) =>
    apiClient.post<{ lease: Lease; message: string }>(`/leases/${leaseId}/move-out-notice`, data),

  /** Owner removes tenant from unit */
  removeTenant: (leaseId: string, data: { reason: string }) =>
    apiClient.post<{ lease: Lease }>(`/leases/${leaseId}/remove-tenant`, data),
};
