import { Prisma, NotificationType } from "@prisma/client";
import * as incidentsRepo from "../repositories/incidentsRepository";
import * as incidentEvidenceRepo from "../repositories/incidentEvidenceRepository";
import * as usersRepo from "../repositories/usersRepository";
import * as notificationsService from "./notificationsService";

export const createIncident = async (input: {
  reporterId?: string;
  reportedUserId?: string;
  reportType: string;
  incidentType: string;
  urgency: string;
  description: string;
  location: string;
  incidentDate: Date;
  incidentTime?: string;
  witnesses?: string;
  againstPerson?: string;
  isAnonymous?: boolean;
}) => {
  const report = await incidentsRepo.createIncidentReport({
    reporter: input.reporterId ? { connect: { id: input.reporterId } } : undefined,
    reportedUser: input.reportedUserId ? { connect: { id: input.reportedUserId } } : undefined,
    reportType: input.reportType,
    incidentType: input.incidentType,
    urgency: input.urgency,
    description: input.description,
    location: input.location,
    incidentDate: input.incidentDate,
    incidentTime: input.incidentTime,
    witnesses: input.witnesses,
    againstPerson: input.againstPerson,
    isAnonymous: input.isAnonymous ?? false,
    status: "OPEN",
  } as Prisma.IncidentReportCreateInput);

  try {
    const admins = await usersRepo.getAllUsers();
    const adminIds = admins.filter((u) => u.role === "ADMIN").map((u) => u.id);
    await Promise.all(
      adminIds.map((id) =>
        notificationsService.createNotification({
          userId: id,
          type: NotificationType.INCIDENT,
          title: "New incident report",
          content: `A new incident report was submitted (${report.id.slice(0, 8).toUpperCase()}).`,
        })
      )
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to notify admins about incident", err);
  }

  return report;
};

export const listIncidents = async (
  where: Prisma.IncidentReportWhereInput,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    incidentsRepo.listIncidentReports(where, skip, limit),
    incidentsRepo.countIncidentReports(where),
  ]);

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getIncidentById = async (id: string) => {
  return incidentsRepo.getIncidentReportById(id);
};

export const updateIncidentStatus = async (
  id: string,
  data: { status: string; adminNote?: string; resolvedBy?: string }
) => {
  return incidentsRepo.updateIncidentReport(id, {
    status: data.status,
    adminNote: data.adminNote,
    resolvedBy: data.resolvedBy,
    resolvedAt: data.status === "RESOLVED" ? new Date() : undefined,
  });
};

export const addIncidentEvidence = async (input: {
  reportId: string;
  fileUrl: string;
  fileName?: string;
  uploadedBy?: string;
}) => {
  return incidentEvidenceRepo.createIncidentEvidence({
    report: { connect: { id: input.reportId } },
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    uploadedByUser: input.uploadedBy ? { connect: { id: input.uploadedBy } } : undefined,
  } as Prisma.IncidentEvidenceCreateInput);
};

export const getIncidentEvidenceById = async (id: string) => {
  return incidentEvidenceRepo.getIncidentEvidenceById(id);
};
