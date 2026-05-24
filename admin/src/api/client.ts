import axios from "axios";
import { appConfig } from "@/lib/app-config";
import { authStorage } from "@/lib/auth-storage";

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken && !refreshToken.includes("mock")) {
        try {
          const { data } = await axios.post(
            `${appConfig.apiBaseUrl}/auth/refresh-token`,
            { refreshToken },
          );
          const storedUser = authStorage.getUser();
          if (storedUser) {
            authStorage.setSession(
              data.accessToken,
              data.refreshToken,
              storedUser,
            );
          }
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          authStorage.clearSession();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
