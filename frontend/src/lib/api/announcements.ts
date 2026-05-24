import apiClient from "@/lib/api-client";
import type { Announcement, PaginatedResponse } from "@/types/api";

export const announcementsApi = {
  list: (params?: { propertyId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Announcement>>("/announcements", { params }),

  create: (data: { title: string; content: string; propertyId?: string }) =>
    apiClient.post<{ announcement: Announcement }>("/announcements", data),

  /** Mark matching ANNOUNCEMENT notifications in the database as read */
  markNotificationsRead: (params?: { title?: string }) =>
    apiClient.post<{ count: number }>("/announcements/mark-read", null, { params }),
};
