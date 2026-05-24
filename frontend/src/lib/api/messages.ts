import apiClient from "@/lib/api-client";
import type { Message, PaginatedResponse, Conversation } from "@/types/api";

export const messagesApi = {
  getConversations: () =>
    apiClient.get<{ conversations: Conversation[] }>("/messages/conversations"),
  /** List messages; pass otherUserId for a specific conversation */
  list: (params?: { otherUserId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Message>>("/messages", { params }),

  getById: (messageId: string) =>
    apiClient.get<{ message: Message }>(`/messages/${messageId}`),

  send: (data: { receiverId: string; subject: string; content: string }) =>
    apiClient.post<{ message: Message }>("/messages", data),

  markRead: (messageId: string) =>
    apiClient.put<{ message: Message }>(`/messages/${messageId}/read`),

  markConversationRead: (otherUserId: string) =>
    apiClient.put<{ count: number }>(
      "/messages/conversation/read",
      {},
      { params: { otherUserId } }
    ),
};

