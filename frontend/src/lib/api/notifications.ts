import apiClient from "@/lib/api-client";
import type { Notification } from "@/types/api";

export const notificationsApi = {
  list: async (params?: { isRead?: boolean }) => {
    const response = await apiClient.get<Notification[]>("/notifications", {
      params: params?.isRead !== undefined ? { isRead: String(params.isRead) } : undefined,
    });
    return response.data;
  },

  markRead: async (notificationId: string) => {
    const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },
};
