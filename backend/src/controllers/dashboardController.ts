import { Request, Response } from "express";
import * as dashboardService from "../services/dashboardService";

export const getOwnerStats = async (req: any, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const stats = await dashboardService.getOwnerStats(ownerId);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch owner stats" });
  }
};

export const getOwnerOverview = async (req: any, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const data = await dashboardService.getOwnerOverview(ownerId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch owner overview" });
  }
};

export const getTenantStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.id;
    const stats = await dashboardService.getTenantStats(tenantId);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tenant stats" });
  }
};

export const getActivities = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const data = await dashboardService.getActivities(userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

export default { getOwnerStats, getOwnerOverview, getTenantStats, getActivities };
