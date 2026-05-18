import { Prisma, PropertyPhoto } from "@prisma/client";
import * as propertyPhotosRepo from "../repositories/propertyPhotosRepository";
import * as propertiesRepo from "../repositories/propertiesRepository";

type SafePhoto = PropertyPhoto;

const sanitize = (photo: PropertyPhoto): SafePhoto => {
  return photo;
};

/**
 * Upload a new photo for a property
 */
export const uploadPhoto = async (
  propertyId: string,
  url: string
): Promise<SafePhoto> => {
  // Validate property exists
  const property = await propertiesRepo.getPropertyById(propertyId);
  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found`);
  }

  // Validate URL
  if (!url || url.trim().length === 0) {
    throw new Error("Photo URL is required");
  }

  const created = await propertyPhotosRepo.createPropertyPhoto({
    url: url.trim(),
    property: { connect: { id: propertyId } },
  });

  return sanitize(created);
};

/**
 * Get a photo by ID
 */
export const getPhotoById = async (id: string): Promise<SafePhoto | null> => {
  if (!id) throw new Error("Photo ID is required");

  const photo = await propertyPhotosRepo.getPropertyPhotoById(id);
  return photo ? sanitize(photo) : null;
};

/**
 * Get all photos for a property
 */
export const getPhotosByProperty = async (
  propertyId: string
): Promise<SafePhoto[]> => {
  if (!propertyId) throw new Error("Property ID is required");

  // Validate property exists
  const property = await propertiesRepo.getPropertyById(propertyId);
  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found`);
  }

  const photos = await propertyPhotosRepo.getPhotosByPropertyId(propertyId);
  return photos.map(sanitize);
};

/**
 * Delete a photo
 */
export const deletePhoto = async (id: string): Promise<SafePhoto> => {
  if (!id) throw new Error("Photo ID is required");

  const photo = await propertyPhotosRepo.getPropertyPhotoById(id);
  if (!photo) {
    throw new Error(`Photo with ID ${id} not found`);
  }

  const deleted = await propertyPhotosRepo.deletePropertyPhoto(id);
  return sanitize(deleted);
};

/**
 * Update photo URL
 */
export const updatePhoto = async (
  id: string,
  url: string
): Promise<SafePhoto> => {
  if (!id) throw new Error("Photo ID is required");
  if (!url || url.trim().length === 0) {
    throw new Error("Photo URL is required");
  }

  const photo = await propertyPhotosRepo.getPropertyPhotoById(id);
  if (!photo) {
    throw new Error(`Photo with ID ${id} not found`);
  }

  const updated = await propertyPhotosRepo.updatePropertyPhoto(id, {
    url: url.trim(),
  });

  return sanitize(updated);
};

export default {
  uploadPhoto,
  getPhotoById,
  getPhotosByProperty,
  deletePhoto,
  updatePhoto,
};
