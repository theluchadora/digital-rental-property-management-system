import type { MaintenanceEvidence, MaintenanceRequest } from "@/types/api";
import apiClient from "@/lib/api-client";

export function formatMaintenancePropertyLabel(req: MaintenanceRequest): string {
  const p = req.property;
  if (!p) return req.unit?.unitIdentifier || "—";
  const parts = [p.title];
  if (p.unitNumber) parts.push(`Unit ${p.unitNumber}`);
  if (p.parent?.title) parts.push(`at ${p.parent.title}`);
  return parts.join(" · ");
}

export function getMaintenanceEvidenceUrls(evidence?: MaintenanceEvidence[]): string[] {
  if (!evidence?.length) return [];
  return evidence
    .map((ev) => ev.fileUrl || `${apiClient.defaults.baseURL}/maintenance-requests/evidence/${ev.id}/download`)
    .filter(Boolean);
}

export function isImageEvidenceUrl(url: string): boolean {
  return !/\.(pdf)(\?|$)/i.test(url);
}

export type MappedMaintenanceRequest = MaintenanceRequest & {
  title?: string;
  detailedDescription?: string;
  category?: string;
  evidenceUrls: string[];
};

export function mapMaintenanceRequest(req: MaintenanceRequest): MappedMaintenanceRequest {
  return {
    ...req,
    category: req.title || req.category,
    tenant: req.createdByUser || req.tenant,
    title: req.title || req.description?.split(".")[0] || "Maintenance Issue",
    detailedDescription: req.description ?? undefined,
    evidenceUrls: getMaintenanceEvidenceUrls(req.evidence),
  };
}
