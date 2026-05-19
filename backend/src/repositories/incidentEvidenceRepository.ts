import prisma from "../config/db";
import { Prisma, IncidentEvidence } from "@prisma/client";

export const createIncidentEvidence = async (
  data: Prisma.IncidentEvidenceCreateInput
): Promise<IncidentEvidence> => {
  return prisma.incidentEvidence.create({ data });
};

export const getIncidentEvidenceById = async (
  id: string
): Promise<IncidentEvidence | null> => {
  return prisma.incidentEvidence.findUnique({ where: { id } });
};

export const listIncidentEvidenceByReportId = async (
  reportId: string
): Promise<IncidentEvidence[]> => {
  return prisma.incidentEvidence.findMany({
    where: { reportId },
    orderBy: { uploadedAt: "desc" },
  });
};
