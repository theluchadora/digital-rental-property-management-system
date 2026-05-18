import { Prisma } from "@prisma/client";
import * as propertiesRepo from "../repositories/propertiesRepository";
import * as photosService from "./photosService";
import { Property as DbProperty } from "@prisma/client";

type SafeProperty = DbProperty & { photos?: string[] };

const sanitize = (property: DbProperty): SafeProperty => {
  // currently no sensitive fields on Property; return as-is
  return property;
};

export const createProperty = async (
  input: any
): Promise<SafeProperty> => {
  // Extract photos array from input
  const { photos, ...propertyData } = input;

  // Create property without photos
  const created = await propertiesRepo.createProperty(propertyData as Prisma.PropertyCreateInput);

  // Create photos if provided
  if (photos && Array.isArray(photos) && photos.length > 0) {
    for (const photoUrl of photos) {
      try {
        await photosService.uploadPhoto(created.id, photoUrl);
      } catch (err: any) {
        
        console.error(`Failed to upload photo for property ${created.id}:`, err.message);
      }
    }
  }

  return sanitize(created);
};

export const getPropertyById = async (id: string): Promise<SafeProperty | null> => {
  const prop = await propertiesRepo.getPropertyById(id);
  const photos = await photosService.getPhotosByProperty(id);
  if (prop) {
    const photoUrls = (photos || []).map((p) => p.url );
    return { ...sanitize(prop), photos: photoUrls };
  }
  return prop ? sanitize(prop) : null;
};

export const listProperties = async (): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getAllProperties();
  const propsWithPhotos = await Promise.all(
    props.map(async (prop) => {
      const photos = await photosService.getPhotosByProperty(prop.id);
      const photoUrls = (photos || []).map((p) => p.url );
      return { ...sanitize(prop), photos: photoUrls };
    })
  );
  return propsWithPhotos;
};


//wont return units since they are not owned by the owner but by the property, and they are not of type UNIT, so we can filter them out in the repo layer itself
export const getPropertiesByOwner = async (ownerId: string): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getPropertiesByOwnerId(ownerId);
  return props.map(sanitize);
};


//once u get the property id, u can get the units under that property, since they are owned by the property and they are of type UNIT, so we can filter them out in the repo layer itself
export const getUnitsUnderProperty = async (propertyId: string): Promise<SafeProperty[]> => {
  const units = await propertiesRepo.getUnitsByPropertyId(propertyId);
  const unitsWithPhotos = await Promise.all(
    units.map(async (unit) => {
      const photos = await photosService.getPhotosByProperty(unit.id);
      const photoUrls = (photos || []).map((p) => p.url );
      return { ...sanitize(unit), photos: photoUrls };
    })
  );
  return unitsWithPhotos;
};


//get vacant units under a property, since they are owned by the property and they are of type UNIT, so we can filter them out in the repo layer itself, and then filter by status here
export const getVacantUnitsUnderProperty = async (propertyId: string): Promise<SafeProperty[]> => {
  const units = await propertiesRepo.getUnitsByPropertyId(propertyId);
  const unitsWithPhotos = await Promise.all(
    units.filter((unit) => unit.status === "VACANT").map(async (unit) => {
      const photos = await photosService.getPhotosByProperty(unit.id);
      const photoUrls = (photos || []).map((p) => p.url );
      return { ...sanitize(unit), photos: photoUrls };
    })
  );
  return unitsWithPhotos;
};

//get vacant properties from the main page
export const getVacantProperties = async (): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getAllProperties();
  const vacantProps = props.filter((prop) => prop.status === "VACANT" && prop.type !== "UNIT");
  const propsWithPhotos = await Promise.all(
    vacantProps.map(async (prop) => {
      const photos = await photosService.getPhotosByProperty(prop.id);
      const photoUrls = (photos || []).map((p) => p.url );
      return { ...sanitize(prop), photos: photoUrls };
    })
  );
  return propsWithPhotos;
};


export const updateProperty = async (
  id: string,
  data: Prisma.PropertyUpdateInput
): Promise<SafeProperty> => {
  const updated = await propertiesRepo.updateProperty(id, data);
  return sanitize(updated);
};

export default {
  createProperty,
  getPropertyById,
  listProperties,
  getPropertiesByOwner,
  getUnitsUnderProperty,
  getVacantUnitsUnderProperty,
  getVacantProperties,
  updateProperty,
};
