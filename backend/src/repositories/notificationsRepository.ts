import prisma from "../config/db";
import { Prisma, Notification } from "@prisma/client";

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
    data: { isRead: true },
  });
};

//* Delete a notification
export const deleteNotification = async (id: string): Promise<Notification> => {
  return prisma.notification.delete({
    where: { id },
  });
};  