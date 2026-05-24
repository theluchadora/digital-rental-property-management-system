import { Prisma } from "@prisma/client";
import * as propertiesRepo from "../repositories/propertiesRepository";
import * as photosService from "./photosService";
import { Property as DbProperty } from "@prisma/client";

type SafeProperty = DbProperty & { photos?: string[] };

const sanitize = (property: DbProperty): SafeProperty => {
  // currently no sensitive fields on Property; return as-is
  return property;
};

/** Load photo URLs for a property; for multi-unit parents, use first unit with photos. */
const attachPhotos = async (property: DbProperty): Promise<SafeProperty> => {
  let photos = (await photosService.getPhotosByProperty(property.id)).map((p) => p.url);

  if (photos.length === 0 && property.hasUnits) {
    const units = await propertiesRepo.getUnitsByPropertyId(property.id);
    for (const unit of units) {
      const unitPhotos = (await photosService.getPhotosByProperty(unit.id)).map((p) => p.url);
      if (unitPhotos.length > 0) {
        photos = unitPhotos;
        break;
      }
    }
  }

  return { ...sanitize(property), photos };
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
  if (!prop) return null;
  return attachPhotos(prop);
};

export const listProperties = async (): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getAllProperties();
  return Promise.all(props.map(attachPhotos));
};

//wont return units since they are not owned by the owner but by the property, and they are not of type UNIT, so we can filter them out in the repo layer itself
export const getPropertiesByOwner = async (ownerId: string): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getPropertiesByOwnerId(ownerId);
  return Promise.all(props.map(attachPhotos));
};


//once u get the property id, u can get the units under that property, since they are owned by the property and they are of type UNIT, so we can filter them out in the repo layer itself
export const getUnitsUnderProperty = async (propertyId: string): Promise<SafeProperty[]> => {
  const units = await propertiesRepo.getUnitsByPropertyId(propertyId);
  return Promise.all(units.map(attachPhotos));
};


//get vacant units under a property, since they are owned by the property and they are of type UNIT, so we can filter them out in the repo layer itself, and then filter by status here
export const getVacantUnitsUnderProperty = async (propertyId: string): Promise<SafeProperty[]> => {
  const units = await propertiesRepo.getUnitsByPropertyId(propertyId);
  const vacant = units.filter((unit) => unit.status === "VACANT");
  return Promise.all(vacant.map(attachPhotos));
};

//get vacant properties from the main page
export const getVacantProperties = async (): Promise<SafeProperty[]> => {
  const props = await propertiesRepo.getAllProperties();
  const vacantProps = props.filter((prop) => prop.status === "VACANT" && prop.type !== "UNIT");
  return Promise.all(vacantProps.map(attachPhotos));
};


export const updateProperty = async (
  id: string,
  data: Prisma.PropertyUpdateInput
): Promise<SafeProperty> => {
  const updated = await propertiesRepo.updateProperty(id, data);
  return sanitize(updated);
};

export const deleteProperty = async (id: string): Promise<SafeProperty> => {
  const deleted = await propertiesRepo.deleteProperty(id);
  return sanitize(deleted);
};

export const searchProperties = async (
  where: Prisma.PropertyWhereInput,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    propertiesRepo.searchProperties(where, skip, limit),
    propertiesRepo.countProperties(where),
  ]);

  const data = await Promise.all(items.map(attachPhotos));

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
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
  deleteProperty,
  searchProperties,
};
