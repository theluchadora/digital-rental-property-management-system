import prisma from "../config/db";
import { Prisma, Lease, LeaseStatus } from "@prisma/client";


//* Create a new lease
export const createLease = async (
  data: Lease
): Promise<Lease> => {
  return prisma.lease.create({
    data,
  });
};

//* Get lease by ID
export const getLeaseById = async (
  id: string
): Promise<Lease | null> => {
  return prisma.lease.findUnique({
    where: { id },
    include: { property: true, tenant: true, owner: true, invoices: true },
  });
};

//* Get all leases
export const getAllLeases = async (): Promise<Lease[]> => {
  return prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: true, owner: true, invoices: true },
  });
};

//*get leases of a specific tenant
export const getLeasesByTenantId = async (
  tenantId: string
): Promise<Lease[]> => {
  return prisma.lease.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: true, owner: true, invoices: true },
  });
};

//* get leases of a specific property
export const getLeasesByPropertyId = async (
  propertyId: string
): Promise<Lease[]> => {
  return prisma.lease.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: true, owner: true, invoices: true },
  });
}


// get leases of a speecific owner
export const getLeasesByOwnerId = async (
  ownerId: string
): Promise<Lease[]> => {
  return prisma.lease.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: true, owner: true, invoices: true },
  });
};

//* update lease
export const updateLease = async (
  id: string,
  data: Prisma.LeaseUpdateInput
): Promise<Lease> => {
  return prisma.lease.update({
    where: { id },
    data,
  });
};


//*update lease status
export const updateLeaseStatus = async (
  id: string,
  status: LeaseStatus
): Promise<Lease> => {
  return prisma.lease.update({
    where: { id },
    data: { status },
  });
};

//* delete lease
export const deleteLease = async (id: string): Promise<Lease> => {
  return prisma.lease.delete({
    where: { id },
  });
};


