import prisma from "../config/db";
import { Prisma, LeaseDocument } from "@prisma/client";

export const createLeaseDocument = async (
  data: Prisma.LeaseDocumentCreateInput
): Promise<LeaseDocument> => {
  return prisma.leaseDocument.create({ data });
};

export const getLeaseDocumentById = async (
  id: string
): Promise<LeaseDocument | null> => {
  return prisma.leaseDocument.findUnique({ where: { id } });
};

export const getLeaseDocumentsByLeaseId = async (
  leaseId: string
): Promise<LeaseDocument[]> => {
  return prisma.leaseDocument.findMany({
    where: { leaseId },
    orderBy: { uploadedAt: "desc" },
  });
};
