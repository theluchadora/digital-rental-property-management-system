import { Prisma } from "@prisma/client";
import * as propertiesRepo from "../repositories/propertiesRepository";
import * as photosService from "./photosService";
import {
  getPropertyIdsWithBlockingLeases,
  isAvailableForPublicListing,
} from "./propertyAvailability";

export const listUnits = async (
  where: Prisma.PropertyWhereInput,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    propertiesRepo.searchProperties(where, skip, limit),
    propertiesRepo.countProperties(where),
  ]);

  const blockedIds = await getPropertyIdsWithBlockingLeases();
  const availableItems = items.filter((item) =>
    isAvailableForPublicListing(item, blockedIds)
  );

  const itemsWithPhotos = await Promise.all(
    availableItems.map(async (item) => {
      const photos = (await photosService.getPhotosByProperty(item.id)).map((p) => p.url);
      return { ...item, photos };
    })
  );

  return {
    data: itemsWithPhotos,
    total: itemsWithPhotos.length,
    page,
    totalPages: Math.ceil(itemsWithPhotos.length / limit) || 1,
  };
};

export const getUnitById = async (id: string) => {
  return propertiesRepo.getPropertyById(id);
};

export const updateUnit = async (id: string, data: Prisma.PropertyUpdateInput) => {
  return propertiesRepo.updateProperty(id, data);
};

export const deleteUnit = async (id: string) => {
  return propertiesRepo.deleteProperty(id);
};
