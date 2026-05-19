import { Prisma } from "@prisma/client";
import * as propertiesRepo from "../repositories/propertiesRepository";

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

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
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
