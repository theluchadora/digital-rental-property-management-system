import apiClient from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api";

export type IncidentReportType = "COMPLAINT" | "HELP_REQUEST";
export type IncidentType =
  | "VIOLENCE" | "HARASSMENT" | "THREAT" | "DISCRIMINATION"
  | "THEFT" | "DAMAGE" | "NOISE" | "OTHER";
export type IncidentUrgency = "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentReportStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

export interface IncidentEvidence {
  id: string;
  reportId: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface IncidentReport {
  id: string;
  reporterId: string | null;
  reportedUserId?: string | null;
  reportType: IncidentReportType;
  incidentType: IncidentType;
  urgency: IncidentUrgency;
  description: string;
  location: string;
  incidentDate: string;
  incidentTime?: string | null;
  witnesses?: string | null;
  againstPerson?: string | null;
  isAnonymous: boolean;
  status: IncidentReportStatus;
  adminNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
  reportedUser?: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
  evidence?: IncidentEvidence[];
}

export interface CreateIncidentPayload {
  reportType: IncidentReportType;
  incidentType: IncidentType;
  urgency: IncidentUrgency;
  description: string;
  location: string;
  incidentDate: string;
  incidentTime?: string;
  witnesses?: string;
  againstPerson?: string;
  reportedUserId?: string;
  isAnonymous?: boolean;
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

export const incidentsApi = {
  /** File a new incident report */
  create: (data: CreateIncidentPayload) =>
    apiClient.post<{ report: IncidentReport }>("/incidents", data),

  /** List own reports (admins see all via admin endpoints) */
  list: (params?: { status?: string; urgency?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<IncidentReport>>("/incidents", { params }),

  /** Get a single report by ID */
  getById: (id: string) =>
    apiClient.get<{ report: IncidentReport }>(`/incidents/${id}`),

  /** Upload evidence file to an existing report */
  uploadEvidence: (reportId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ evidence: IncidentEvidence }>(
      `/upload/incident-evidence/${reportId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  /** Download an evidence file */
  downloadEvidence: (evidenceId: string) =>
    downloadBlob(`/download/incident-evidence/${evidenceId}`, `evidence_${evidenceId}`),

  // ── Admin ────────────────────────────────────────────────────────────────

  adminListAll: (params?: { status?: string; urgency?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<IncidentReport>>("/admin/incidents", { params }),

  adminGetById: (id: string) =>
    apiClient.get<{ report: IncidentReport }>(`/admin/incidents/${id}`),

  adminUpdateStatus: (id: string, data: { status: string; adminNote?: string }) =>
    apiClient.patch<{ report: IncidentReport }>(`/admin/incidents/${id}/status`, data),
};
