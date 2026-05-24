import apiClient from "@/lib/api-client";
import { uploadMaintenanceImage } from "@/lib/cloudinary";
import type {
  MaintenanceRequest,
  MaintenanceEvidence,
  PaginatedResponse,
  LeasablePropertyOption,
} from "@/types/api";

export interface CreateMaintenancePayload {
  unitId: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description: string;
}

export const maintenanceApi = {
  getLeasableProperties: () =>
    apiClient
      .get<{ properties: LeasablePropertyOption[] }>("/maintenance-requests/leasable-properties")
      .then((res) => res.data.properties),

  list: (params?: { status?: string; unitId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance-requests", { params }),

  getById: (id: string) =>
    apiClient.get<{ request: MaintenanceRequest }>(`/maintenance-requests/${id}`),

  create: (data: CreateMaintenancePayload) =>
    apiClient.post<{ request: MaintenanceRequest }>("/maintenance-requests", data),

  /** Owner/Admin updates maintenance status */
  updateStatus: (requestId: string, data: { status: string; note?: string }) =>
    apiClient.put<{ request: MaintenanceRequest }>(`/maintenance-requests/${requestId}/status`, data),

  /** Upload to Cloudinary, then register evidence on the request */
  uploadEvidence: async (requestId: string, file: File) => {
    const fileUrl = await uploadMaintenanceImage(file, requestId);
    return apiClient.post<{ evidence: MaintenanceEvidence }>(
      `/maintenance-requests/${requestId}/evidence`,
      { fileUrl, fileName: file.name }
    );
  },

  getEvidenceDownloadUrl: (evidenceId: string) =>
    `${apiClient.defaults.baseURL}/maintenance-requests/evidence/${evidenceId}/download`,
};
