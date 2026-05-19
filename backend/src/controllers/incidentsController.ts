import { Request, Response } from "express";
import { z } from "zod";
import * as incidentsService from "../services/incidentsService";

const createSchema = z.object({
  reportType: z.string(),
  incidentType: z.string(),
  urgency: z.string(),
  description: z.string(),
  location: z.string(),
  incidentDate: z.string(),
  incidentTime: z.string().optional(),
  witnesses: z.string().optional(),
  againstPerson: z.string().optional(),
  reportedUserId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

const evidenceSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
});

export const create = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    const report = await incidentsService.createIncident({
      reporterId: body.isAnonymous ? undefined : req.user?.id,
      reportedUserId: body.reportedUserId,
      reportType: body.reportType,
      incidentType: body.incidentType,
      urgency: body.urgency,
      description: body.description,
      location: body.location,
      incidentDate: new Date(body.incidentDate),
      incidentTime: body.incidentTime,
      witnesses: body.witnesses,
      againstPerson: body.againstPerson,
      isAnonymous: body.isAnonymous,
    });

    res.status(201).json({ report });
  } catch (err: any) {
    console.error("Error caught in incidentsController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to create report" });
  }
};

export const list = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
  try {
    const { status, urgency, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;

    if (req.user?.role !== "ADMIN" && req.user?.id) {
      where.reporterId = req.user.id;
    }

    const result = await incidentsService.listIncidents(where, Number(page), Number(limit));
    res.json(result);
  } catch (err: any) {
    console.error("Error caught in incidentsController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list reports" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const report = await incidentsService.getIncidentById(req.params.id as string);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ report });
  } catch (err: any) {
    console.error("Error caught in incidentsController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to get report" });
  }
};

export const uploadEvidence = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const body = evidenceSchema.parse(req.body);
    const evidence = await incidentsService.addIncidentEvidence({
      reportId: req.params.id as string,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      uploadedBy: req.user?.id,
    });
    res.status(201).json({ evidence });
  } catch (err: any) {
    console.error("Error caught in incidentsController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to upload evidence" });
  }
};

export const downloadEvidence = async (req: Request, res: Response) => {
  try {
    const evidence = await incidentsService.getIncidentEvidenceById(req.params.id as string);
    if (!evidence) return res.status(404).json({ error: "Evidence not found" });
    res.redirect(evidence.fileUrl);
  } catch (err: any) {
    console.error("Error caught in incidentsController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to download evidence" });
  }
};
