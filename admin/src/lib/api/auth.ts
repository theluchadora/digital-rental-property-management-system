import apiClient from "@/lib/api-client";
import type { AuthResponse, User, UserRole } from "@/types/api";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
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
    apiClient.post<AuthResponse>("/auth/register", data),

  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  logout: () => apiClient.post<{ message: string }>("/auth/logout"),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh-token",
      { refreshToken },
    ),

  getProfile: () => apiClient.get<{ user: User }>("/auth/profile"),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put<{ user: User }>("/auth/profile", data),

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ user: { id: string; profilePictureUrl: string } }>(
      "/auth/profile/picture",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

  getProfilePictureUrl: (userId: string) =>
    `${apiClient.defaults.baseURL}/auth/profile/picture/${userId}`,
};
