import apiClient from "@/lib/api-client";
import type { User } from "@/types/api";

export const usersApi = {
  search: async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];
    const response = await apiClient.get<User[]>("/users/search", {
      params: { q: query.trim() },
    });
    return response.data;
  },
};
