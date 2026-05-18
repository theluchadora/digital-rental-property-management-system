import apiClient from "@/lib/api-client";
import type { User, UserRole } from "@/types/api";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<User>("/users/register", data),

  login: (data: LoginPayload) =>
    apiClient.post<{ message: string; user: User }>("/users/login", data),

  logout: () =>
    apiClient.post<{ message: string }>("/users/logout"),

  getProfile: () =>
    apiClient.get<User>("/users/me"),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.patch<User>("/users/me", data),

  deleteAccount: () =>
  apiClient.delete<{ message: string }>("/users/me"),
};
