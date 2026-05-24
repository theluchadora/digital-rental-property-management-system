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

function hasCloudinaryConfig(): boolean {
  return Boolean(
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME &&
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
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

  updateStatus: (requestId: string, data: { status: string; note?: string }) =>
    apiClient.put<{ request: MaintenanceRequest }>(`/maintenance-requests/${requestId}/status`, data),

  /** Cloudinary when configured; otherwise server base64 upload */
  uploadEvidence: async (requestId: string, file: File) => {
    if (hasCloudinaryConfig()) {
      try {
        const fileUrl = await uploadMaintenanceImage(file, requestId);
        return apiClient.post<{ evidence: MaintenanceEvidence }>(
          `/maintenance-requests/${requestId}/evidence`,
          { fileUrl, fileName: file.name }
        );
      } catch (err) {
        console.warn("Cloudinary upload failed, using server upload:", err);
      }
    }

    const { base64, mimeType } = await fileToBase64(file);
    return apiClient.post<{ evidence: MaintenanceEvidence }>(
      `/maintenance-requests/${requestId}/evidence`,
      {
        fileBase64: base64,
        fileName: file.name,
        mimeType,
      }
    );
  },

  getEvidenceDownloadUrl: (evidenceId: string) =>
    `${apiClient.defaults.baseURL}/maintenance-requests/evidence/${evidenceId}/download`,
};
