import apiClient from "@/lib/api-client";
import type { MaintenanceRequest, MaintenanceEvidence, PaginatedResponse } from "@/types/api";

export interface CreateMaintenancePayload {
  unitId: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description: string;
}

export const maintenanceApi = {
  list: (params?: { status?: string; unitId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance-requests", { params }),

  getById: (id: string) =>
    apiClient.get<{ request: MaintenanceRequest }>(`/maintenance-requests/${id}`),

  create: (data: CreateMaintenancePayload) =>
    apiClient.post<{ request: MaintenanceRequest }>("/maintenance-requests", data),

  /** Owner/Admin updates maintenance status */
  updateStatus: (requestId: string, data: { status: string; note?: string }) =>
    apiClient.put<{ request: MaintenanceRequest }>(`/maintenance-requests/${requestId}/status`, data),

  /** Tenant uploads evidence (multipart) */
  uploadEvidence: (requestId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ evidence: MaintenanceEvidence }>(`/maintenance-requests/${requestId}/evidence`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getEvidenceDownloadUrl: (evidenceId: string) =>
    `${apiClient.defaults.baseURL}/maintenance-requests/evidence/${evidenceId}/download`,
};
