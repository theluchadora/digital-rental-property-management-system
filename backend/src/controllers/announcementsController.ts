import { Request, Response } from "express";
import { z } from "zod";
import * as announcementsService from "../services/announcementsService";
import * as leasesRepo from "../repositories/leasesRepository";
import * as notificationsRepo from "../repositories/notificationsRepository";

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  propertyId: z.string().optional(),
});

export const list = async (req: Request & { user?: { id: string; role: string } }, res: Response) => {
  try {
    const { propertyId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};

    if (propertyId) where.propertyId = propertyId;

    if (req.user?.role === "OWNER" && req.user?.id) {
      where.ownerId = req.user.id;
    }

    if (req.user?.role === "TENANT" && req.user?.id) {
      const leases = await leasesRepo.getLeasesByTenantId(req.user.id);
      const propertyIds = leases.map((l) => l.propertyId);
      const ownerIds = Array.from(new Set(leases.map((l) => l.ownerId)));
      where.OR = [
        { propertyId: null, ownerId: { in: ownerIds } },
        { propertyId: { in: propertyIds } },
      ];
    }

    const result = await announcementsService.listAnnouncements(where, Number(page), Number(limit));
    res.json(result);
  } catch (err: any) {
    console.error("Error caught in announcementsController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to list announcements" });
  }
};

export const markRead = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const title = req.query.title as string | undefined;
    const count = await notificationsRepo.markAnnouncementNotificationsAsRead(req.user.id, {
      title,
    });

    res.json({ count });
  } catch (err: any) {
    console.error("Error caught in announcementsController.ts (markRead):", err);
    res.status(500).json({ error: err.message || "Failed to mark announcements as read" });
  }
};

export const create = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const announcement = await announcementsService.createAnnouncement({
      ownerId: req.user.id,
      propertyId: body.propertyId,
      title: body.title,
      content: body.content,
    });

    res.status(201).json({ announcement });
  } catch (err: any) {
    console.error("Error caught in announcementsController.ts:", err);
    res.status(400).json({ error: err.message || "Failed to create announcement" });
  }
};
