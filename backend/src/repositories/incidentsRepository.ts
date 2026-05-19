import prisma from "../config/db";
import { Prisma, IncidentReport } from "@prisma/client";

export const createIncidentReport = async (
  data: Prisma.IncidentReportCreateInput
): Promise<IncidentReport> => {
  return prisma.incidentReport.create({ data });
};

export const getIncidentReportById = async (
  id: string
): Promise<IncidentReport | null> => {
  return prisma.incidentReport.findUnique({
    where: { id },
    include: { reporter: true, reportedUser: true, evidence: true },
  });
};

export const listIncidentReports = async (
  where: Prisma.IncidentReportWhereInput,
  skip: number,
  take: number
): Promise<IncidentReport[]> => {
  return prisma.incidentReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: { reporter: true, reportedUser: true, evidence: true },
  });
};

export const countIncidentReports = async (
  where: Prisma.IncidentReportWhereInput
): Promise<number> => {
  return prisma.incidentReport.count({ where });
};

export const updateIncidentReport = async (
  id: string,
  data: Prisma.IncidentReportUpdateInput
): Promise<IncidentReport> => {
  return prisma.incidentReport.update({ where: { id }, data });
};
