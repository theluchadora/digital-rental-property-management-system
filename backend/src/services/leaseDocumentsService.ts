import { Prisma } from "@prisma/client";
import * as leaseDocsRepo from "../repositories/leaseDocumentsRepository";

export const addLeaseDocument = async (input: {
  leaseId: string;
  fileUrl: string;
  fileName?: string;
  documentType?: string;
  uploadedBy?: string;
}) => {
  return leaseDocsRepo.createLeaseDocument({
    lease: { connect: { id: input.leaseId } },
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    documentType: input.documentType,
    uploadedByUser: input.uploadedBy ? { connect: { id: input.uploadedBy } } : undefined,
  } as Prisma.LeaseDocumentCreateInput);
};

export const getLeaseDocumentById = async (id: string) => {
  return leaseDocsRepo.getLeaseDocumentById(id);
};

export const listLeaseDocuments = async (leaseId: string) => {
  return leaseDocsRepo.getLeaseDocumentsByLeaseId(leaseId);
};
