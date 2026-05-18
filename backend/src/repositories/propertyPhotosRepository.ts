import prisma from "../config/db";
import { Prisma, PropertyPhoto } from "@prisma/client";

//* Create a new property photo
export const createPropertyPhoto = async (
  data: Prisma.PropertyPhotoCreateInput
): Promise<PropertyPhoto> => {
  return prisma.propertyPhoto.create({
    data,
  });
};

//* Get property photo by ID
export const getPropertyPhotoById = async (
  id: string
): Promise<PropertyPhoto | null> => {
  return prisma.propertyPhoto.findUnique({
    where: { id },
  });
};

//* Get all photos for a specific property
export const getPhotosByPropertyId = async (
  propertyId: string
): Promise<PropertyPhoto[]> => {
  return prisma.propertyPhoto.findMany({
    where: { propertyId },
    orderBy: { uploadedAt: "desc" },
  });
};

//* Update property photo
export const updatePropertyPhoto = async (
  id: string,
  data: Prisma.PropertyPhotoUpdateInput
): Promise<PropertyPhoto> => {
  return prisma.propertyPhoto.update({
    where: { id },
    data,
  });
};

//* Delete property photo
export const deletePropertyPhoto = async (id: string): Promise<PropertyPhoto> => {
  return prisma.propertyPhoto.delete({
    where: { id },
  });
};