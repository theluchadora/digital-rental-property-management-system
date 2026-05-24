import prisma from "../config/db";
import { Prisma, Maintenance } from "@prisma/client";

export const createMaintenance = async (
  data: Prisma.MaintenanceCreateInput
): Promise<Maintenance> => {
  return prisma.maintenance.create({ data });
};

export const getMaintenanceById = async (
  id: string
): Promise<Maintenance | null> => {
  return prisma.maintenance.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          unitNumber: true,
          type: true,
          city: true,
          address: true,
          parent: { select: { title: true } },
        },
      },
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      evidence: true,
    },
  });
};

export const listMaintenance = async (
  where: Prisma.MaintenanceWhereInput,
  skip: number,
  take: number
): Promise<Maintenance[]> => {
  return prisma.maintenance.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      property: {
        select: {
          id: true,
          title: true,
          unitNumber: true,
          type: true,
          city: true,
          address: true,
          parent: { select: { title: true } },
        },
      },
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      evidence: true,
    },
  });
};

export const countMaintenance = async (
  where: Prisma.MaintenanceWhereInput
): Promise<number> => {
  return prisma.maintenance.count({ where });
};

export const updateMaintenance = async (
  id: string,
  data: Prisma.MaintenanceUpdateInput
): Promise<Maintenance> => {
  return prisma.maintenance.update({ where: { id }, data });
};
