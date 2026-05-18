import apiClient from "@/lib/api-client";
import type { Lease, Invoice, LeaseDocument } from "@/types/api";

export const leasesApi = {
  // Get a single lease by ID
  getById: (id: string) => 
    apiClient.get<{ lease: Lease }>(`/leases/${id}`),
  
  // Upload a document for a lease
  uploadDocument: (leaseId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    return apiClient.post<{ document: LeaseDocument }>(`/leases/${leaseId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  
  // Get download URL for a document
  getDocumentDownloadUrl: (documentId: string) => 
    `${apiClient.defaults.baseURL}/leases/documents/${documentId}/download`,
};

export const invoicesApi = {
  // List invoices with optional filters
  list: (params?: { leaseId?: string; limit?: number; page?: number }) =>
    apiClient.get<{ data: Invoice[]; total: number; page: number; totalPages: number }>("/invoices", { params }),
};