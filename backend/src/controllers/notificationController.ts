import {Request , Response } from "express";
import * as notificationsService from "../services/notificationsService";




export const getMyNotifications = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isReadParam = req.query.isRead as string | undefined;
    let notifications = await notificationsService.getNotificationsByUserId(userId);
    if (isReadParam === "false") {
      notifications = notifications.filter((n) => !n.isRead);
    } else if (isReadParam === "true") {
      notifications = notifications.filter((n) => n.isRead);
    }
    res.json(notifications);
  } catch (err: any) {
    console.error("Error caught in notificationController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to get notifications" });
  }
};

export const markNotificationAsRead = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = req.user?.id;
    const notificationId = (req.params.id || req.body.id) as string;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!notificationId) {
      return res.status(400).json({ error: "Notification id is required" });
    }

    const updatedNotification = await notificationsService.markAsRead(notificationId);
    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(updatedNotification);
  } catch (err: any) {
    console.error("Error caught in notificationController.ts:", err);
    res.status(500).json({ error: err.message || "Failed to mark notification as read" });
  }
};
