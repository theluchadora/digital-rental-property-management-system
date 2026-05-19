import prisma from "../config/db";
import { Prisma, Property } from "@prisma/client";

//* Create a new property
export const createProperty = async (
  data: Prisma.PropertyCreateInput
): Promise<Property> => {
  return prisma.property.create({
    data,
  });
};

//* Get property by ID
export const getPropertyById = async (
  id: string
): Promise<Property | null> => {
  return prisma.property.findUnique({
    where: { id },
  });
};

//* Get all properties
export const getAllProperties = async (): Promise<Property[]> => {
  return prisma.property.findMany({
    orderBy: { createdAt: "desc" },
  });
};

//* get properties having a specific owner
export const getPropertiesByOwnerId = async (
  ownerId: string
): Promise<Property[]> => {
  return prisma.property.findMany({
    where: { ownerId, type: { not: "UNIT" } },
    orderBy: { createdAt: "desc" },
  });
};

//* get units of a property
export const getUnitsByPropertyId = async (
  propertyId: string
): Promise<Property[]> => {
  return prisma.property.findMany({
    where: { parentId: propertyId },
    orderBy: { createdAt: "desc" },
  });
}


//* update property
export const updateProperty = async (
  id: string,
  data: Prisma.PropertyUpdateInput
): Promise<Property> => {
  return prisma.property.update({
    where: { id },
    data,
  });
};

//* delete property
export const deleteProperty = async (id: string): Promise<Property> => {
  return prisma.property.delete({
    where: { id },
  });
};

//* search properties with filters + pagination
export const searchProperties = async (
  where: Prisma.PropertyWhereInput,
  skip: number,
  take: number
): Promise<Property[]> => {
  return prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};

//* count properties for pagination
export const countProperties = async (
  where: Prisma.PropertyWhereInput
): Promise<number> => {
  return prisma.property.count({ where });
};