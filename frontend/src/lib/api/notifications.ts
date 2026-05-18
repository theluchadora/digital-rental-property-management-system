import apiClient from "@/lib/api-client";
import type { Notification, PaginatedResponse } from "@/types/api";

export const notificationsApi = {
  list: (params?: { isRead?: boolean; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Notification>>("/notifications", { params }),

  markRead: (notificationId: string) =>
    apiClient.put<{ notification: Notification }>(`/notifications/${notificationId}/read`),
};
