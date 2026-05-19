import { Prisma } from "@prisma/client";
import * as propertiesRepo from "../repositories/propertiesRepository";

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

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
