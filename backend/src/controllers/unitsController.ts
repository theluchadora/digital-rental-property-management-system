import { Request, Response } from "express";
import { z } from "zod";
import * as unitsService from "../services/unitsService";
import logger from "../utils/logger";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  unitNumber: z.string().optional(),
  floorNumber: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().optional(),
  monthlyRent: z.number().optional(),
  paidEvery: z.number().optional(),
  minLeaseMonth: z.number().optional(),
  latefee: z.number().optional(),
});

export const list = async (req: Request, res: Response) => {
  try {
    const { city, minRent, maxRent, bedrooms, status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {
      OR: [
        { type: "UNIT" },
        { type: "VEHICLE" },
        { type: "HOUSE", hasUnits: false },
        { type: "BUILDING", hasUnits: false }
      ]
    };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (status) where.status = status;
    if (bedrooms) where.bedrooms = Number(bedrooms);
    if (minRent || maxRent) {
      where.monthlyRent = {};
      if (minRent) where.monthlyRent.gte = Number(minRent);
      if (maxRent) where.monthlyRent.lte = Number(maxRent);
    }

    const result = await unitsService.listUnits(where, Number(page), Number(limit));
    res.json({ data: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
  } catch (err: any) {
    logger.error({ err, route: "GET /units" }, "Units list failed");
    res.status(500).json({ error: err.message || "Failed to list units" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const unit = await unitsService.getUnitById(req.params.id as string);
    if (!unit) {
      logger.info({ route: "GET /units/:id", id: req.params.id, found: false }, "Unit lookup");
      return res.status(404).json({ error: "Unit not found" });
    }
    logger.info({ route: "GET /units/:id", id: req.params.id, found: true }, "Unit lookup");
    res.json({ unit, property: unit });
  } catch (err: any) {
    logger.error({ err, route: "GET /units/:id", id: req.params.id }, "Unit detail failed");
    res.status(500).json({ error: err.message || "Failed to get unit" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const unit = await unitsService.updateUnit(req.params.id as string, data as any);
    res.json({ unit });
  } catch (err: any) {
    logger.error({ err, route: "PATCH /units/:id", id: req.params.id }, "Unit update failed");
    res.status(400).json({ error: err.message || "Failed to update unit" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const unit = await unitsService.deleteUnit(req.params.id as string);
    res.json({ unit });
  } catch (err: any) {
    logger.error({ err, route: "DELETE /units/:id", id: req.params.id }, "Unit delete failed");
    res.status(400).json({ error: err.message || "Failed to delete unit" });
  }
};
