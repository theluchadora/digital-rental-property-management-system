import { Notification as DbNotification, NotificationType as DbNotificationType } from "@prisma/client";
import { User } from "./user.types";

export type NotificationType = DbNotificationType;

export interface Notification extends DbNotification {
  user?: User;
}

export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead?: boolean;
  readAt?: Date | null;
  invoiceId?: string | null;
  leaseId?: string | null;
  messageId?: string | null;
}

export interface NotificationUpdateInput {
  isRead?: boolean;
  readAt?: Date;
}
