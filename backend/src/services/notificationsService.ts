import * as notificationsRepo from "../repositories/notificationsRepository";
import { Notification as DbNotification } from "@prisma/client";
import { sendToUser } from "../websocket/wsServer";
import {
  Notification as NotificationModel,
  NotificationCreateInput,
} from "../types/notification.types";

type SafeNotification = NotificationModel;

const sanitize = (notification: DbNotification): any => {
  let entityId: string | null = null;
  let entityType: string | null = null;

  if (notification.invoiceId) {
    entityId = notification.invoiceId;
    entityType = "INVOICE";
  } else if (notification.leaseId) {
    entityId = notification.leaseId;
    entityType = "LEASE";
  } else if (notification.messageId) {
    entityId = notification.messageId;
    entityType = "MESSAGE";
  }

  return {
    ...notification,
    message: notification.content,
    entityId,
    entityType,
  };
};

export const createNotification = async (
  input: NotificationCreateInput
): Promise<SafeNotification> => {
  const created = await notificationsRepo.createNotification({
    user: { connect: { id: input.userId } },
    type: input.type,
    title: input.title,
    content: input.content,
    invoiceId: input.invoiceId,
    leaseId: input.leaseId,
    messageId: input.messageId,
  });
    // Send real-time notification to user via WebSocket
    sendToUser(created.userId, {  
      for: "NOTIFICATION",
     ...sanitize(created),
    });
  return sanitize(created);
};

export const getNotificationsByUserId = async (
  userId: string
): Promise<SafeNotification[]> => {
  const notifications = await notificationsRepo.getNotificationsByUserId(userId);
  return notifications.map(sanitize);
};

export const markAsRead = async (id: string): Promise<SafeNotification | null> => {
  const updated = await notificationsRepo.markNotificationAsRead(id);
  return updated ? sanitize(updated) : null;
};

export const deleteNotification = async (id: string): Promise<void> => {
  await notificationsRepo.deleteNotification(id);
};