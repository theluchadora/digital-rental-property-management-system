import { Prisma, NotificationType } from "@prisma/client";
import * as maintenanceRepo from "../repositories/maintenanceRepository";
import * as maintenanceEvidenceRepo from "../repositories/maintenanceEvidenceRepository";
import * as propertiesRepo from "../repositories/propertiesRepository";
import * as notificationsService from "./notificationsService";

export const createMaintenance = async (input: {
  propertyId: string;
  createdBy: string;
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) => {
  const property = await propertiesRepo.getPropertyById(input.propertyId);
  if (!property) throw new Error("Property not found");

  const created = await maintenanceRepo.createMaintenance({
    property: { connect: { id: input.propertyId } },
    createdByUser: { connect: { id: input.createdBy } },
    title: input.title,
    description: input.description,
    priority: input.priority ?? "MEDIUM",
    status: "OPEN",
  } as Prisma.MaintenanceCreateInput);

  try {
    await notificationsService.createNotification({
      userId: property.ownerId,
      type: NotificationType.MAINTENANCE,
      title: "New maintenance request",
      content: `${input.title} was submitted for ${property.title}.`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to notify owner about maintenance", err);
  }

  return created;
};

export const listMaintenance = async (where: Prisma.MaintenanceWhereInput, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    maintenanceRepo.listMaintenance(where, skip, limit),
    maintenanceRepo.countMaintenance(where),
  ]);

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getMaintenanceById = async (id: string) => {
  return maintenanceRepo.getMaintenanceById(id);
};

export const updateMaintenanceStatus = async (
  id: string,
  data: { status: string; notes?: string }
) => {
  const updated = await maintenanceRepo.updateMaintenance(id, {
    status: data.status as any,
    notes: data.notes,
    completedDate: data.status === "RESOLVED" ? new Date() : undefined,
  });

  try {
    await notificationsService.createNotification({
      userId: updated.createdBy,
      type: NotificationType.MAINTENANCE,
      title: "Maintenance status updated",
      content: `Your request is now ${updated.status}.`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to notify requester", err);
  }

  return updated;
};

export const addEvidence = async (input: {
  maintenanceId: string;
  fileUrl: string;
  fileName?: string;
  uploadedBy?: string;
}) => {
  return maintenanceEvidenceRepo.createMaintenanceEvidence({
    maintenance: { connect: { id: input.maintenanceId } },
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    uploadedByUser: input.uploadedBy ? { connect: { id: input.uploadedBy } } : undefined,
  } as Prisma.MaintenanceEvidenceCreateInput);
};

export const getEvidenceById = async (id: string) => {
  return maintenanceEvidenceRepo.getMaintenanceEvidenceById(id);
};
