import {Request , Response } from "express";
import * as propertiesService from "../services/propertiesService";

export const createProperty = async (req: Request & { user?: { id: string , role: string } }, res: Response) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: "Unauthorized" });
    const role = req.user?.role;
    if (role !== "OWNER") return res.status(403).json({ error: "Only landlords can create properties" });
    // Pass all data including photos to service
    const property = await propertiesService.createProperty({ ownerId, ...req.body });
    res.status(201).json(property);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to create property" });
  }
};


export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await propertiesService.getPropertyById(req.params.id as string);
    if (!property) {
      console.info("Property lookup", {
        route: "GET /properties/:id",
        id: req.params.id,
        found: false,
      });
      return res.status(404).json({ error: "Property not found" });
    }
    console.info("Property lookup", {
      route: "GET /properties/:id",
      id: req.params.id,
      found: true,
    });
    res.json(property);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to get property" });
  }
};

export const listProperties = async (req: Request, res: Response) => {
  try {
    const {
      city,
      type,
      status,
      minRent,
      maxRent,
      bedrooms,
      hasUnits,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const where: any = {};
    // Portfolio listing: top-level properties only (units listed under parents)
    if (!type) where.type = { not: "UNIT" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (type) where.type = type;
    if (status) where.status = status;
    if (hasUnits !== undefined) where.hasUnits = hasUnits === "true";
    if (bedrooms) where.bedrooms = Number(bedrooms);
    if (minRent || maxRent) {
      where.monthlyRent = {};
      if (minRent) where.monthlyRent.gte = Number(minRent);
      if (maxRent) where.monthlyRent.lte = Number(maxRent);
    }

    const result = await propertiesService.searchProperties(
      where,
      Number(page),
      Number(limit)
    );
    res.json(result);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list properties" });
  }
};

//get properties by owner id
export const getPropertiesByOwner = async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.ownerId as string;
    const properties = await propertiesService.getPropertiesByOwner(ownerId);
    res.json(properties);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list properties" });
  }
};

//get units under a property
export const getUnitsUnderProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const units = await propertiesService.getUnitsUnderProperty(propertyId);
    res.json(units);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list units" });
  }
};

//get vacant units under a property
export const getVacantUnitsUnderProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const units = await propertiesService.getVacantUnitsUnderProperty(propertyId);
    res.json(units);
  } catch (err  :any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list units" });
  }
};

//get vacant properties from the main page
export const getVacantProperties = async (_req: Request, res: Response) => {
  try {
    const properties = await propertiesService.getVacantProperties();
    res.json(properties);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list properties" });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const updated = await propertiesService.updateProperty(req.params.id as string, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to update property" });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const deleted = await propertiesService.deleteProperty(req.params.id as string);
    res.json(deleted);
  } catch (err: any) {
    console.error("Error caught in propertyController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to delete property" });
  }
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
};