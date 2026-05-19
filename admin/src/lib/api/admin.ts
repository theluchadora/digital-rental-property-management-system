import apiClient from "@/lib/api-client";
import type { User, AuthResponse, PaginatedResponse } from "@/types/api";

export interface CreateAdminPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
}

export const adminApi = {
  listUsers: (params?: {
    role?: string;
    accountStatus?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<PaginatedResponse<User>>("/admin/users", { params }),

  removeUser: (userId: string) =>
    apiClient.delete<void>(`/admin/users/${userId}`),

  createAdmin: (data: CreateAdminPayload) =>
    apiClient.post<AuthResponse>("/admin/create-admin", data),
};
