import prisma from "../config/db";
import { Prisma, Notification, NotificationType } from "@prisma/client";

//* Create a new notification
export const createNotification = async (
  data: Prisma.NotificationCreateInput
): Promise<Notification> => {
  return prisma.notification.create({
    data,
  });
};

//* Get notifications for a specific user
export const getNotificationsByUserId = async (
  userId: string
): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

//* Mark a notification as read
export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
};

export const markMessageNotificationsFromSender = async (
  userId: string,
  senderId: string
): Promise<number> => {
  const messages = await prisma.message.findMany({
    where: { senderId, receiverId: userId },
    select: { id: true },
  });
  if (messages.length === 0) return 0;

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      type: NotificationType.MESSAGE,
      isRead: false,
      messageId: { in: messages.map((m) => m.id) },
    },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
};

export const markAnnouncementNotificationsAsRead = async (
  userId: string,
  options?: { title?: string; markAllUnread?: boolean }
): Promise<number> => {
  const where: Prisma.NotificationWhereInput = {
    userId,
    type: NotificationType.ANNOUNCEMENT,
    isRead: false,
  };
  if (options?.title) where.title = options.title;

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
};

//* Delete a notification
export const deleteNotification = async (id: string): Promise<Notification> => {
  return prisma.notification.delete({
    where: { id },
  });
};  