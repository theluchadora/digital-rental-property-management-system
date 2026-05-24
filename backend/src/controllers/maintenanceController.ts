import { Request, Response } from "express";
import { z } from "zod";
import * as maintenanceService from "../services/maintenanceService";

const createSchema = z.object({
  unitId: z.string(),
  category: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  description: z.string(),
});

const statusSchema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

const evidenceSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
});

export const getLeasableProperties = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    const properties = await maintenanceService.getLeasablePropertiesForTenant(req.user.id);
    res.json({ properties });
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts (getLeasableProperties):", err);
    res.status(500).json({ error: err.message || "Failed to load leased properties" });
  }
};

export const list = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
  try {
    const { status, unitId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (unitId) where.propertyId = unitId;

    if (req.user?.role === "TENANT" && req.user?.id) {
      where.createdBy = req.user.id;
    }
    if (req.user?.role === "OWNER" && req.user?.id) {
      where.property = { ownerId: req.user.id };
    }

    const result = await maintenanceService.listMaintenance(where, Number(page), Number(limit));
    res.json(result);
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list maintenance requests" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const request = await maintenanceService.getMaintenanceById(req.params.id as string);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json({ request });
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to get request" });
  }
};

export const create = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const created = await maintenanceService.createMaintenance({
      propertyId: body.unitId,
      createdBy: req.user.id,
      title: body.category,
      description: body.description,
      priority: body.priority,
    });

    res.status(201).json({ request: created });
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to create request" });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const body = statusSchema.parse(req.body);
    const updated = await maintenanceService.updateMaintenanceStatus(req.params.id as string, {
      status: body.status,
      notes: body.note,
    });
    res.json({ request: updated });
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to update status" });
  }
};

export const uploadEvidence = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const maintenance = await maintenanceService.getMaintenanceById(req.params.id as string);
    if (!maintenance) return res.status(404).json({ error: "Request not found" });
    if (maintenance.createdBy !== req.user.id) {
      return res.status(403).json({ error: "Only the request creator can upload evidence" });
    }

    const body = evidenceSchema.parse(req.body);
    const evidence = await maintenanceService.addEvidence({
      maintenanceId: req.params.id as string,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      uploadedBy: req.user.id,
    });
    res.status(201).json({ evidence });
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to upload evidence" });
  }
};

export const downloadEvidence = async (req: Request, res: Response) => {
  try {
    const evidence = await maintenanceService.getEvidenceById(req.params.id as string);
    if (!evidence) return res.status(404).json({ error: "Evidence not found" });
    res.redirect(evidence.fileUrl);
  } catch (err: any) {
    console.error("Error caught in maintenanceController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to download evidence" });
  }
};
