import prisma from "../config/db";
import { Prisma, MaintenanceEvidence } from "@prisma/client";

export const createMaintenanceEvidence = async (
  data: Prisma.MaintenanceEvidenceCreateInput
): Promise<MaintenanceEvidence> => {
  return prisma.maintenanceEvidence.create({ data });
};

export const getMaintenanceEvidenceById = async (
  id: string
): Promise<MaintenanceEvidence | null> => {
  return prisma.maintenanceEvidence.findUnique({ where: { id } });
};

export const listMaintenanceEvidenceByRequestId = async (
  maintenanceId: string
): Promise<MaintenanceEvidence[]> => {
  return prisma.maintenanceEvidence.findMany({
    where: { maintenanceId },
    orderBy: { uploadedAt: "desc" },
  });
};
