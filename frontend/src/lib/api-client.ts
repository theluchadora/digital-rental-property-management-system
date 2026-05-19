import axios from "axios";
import { appConfig } from "@/lib/app-config";

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Important for cookies
});

// No need for request interceptor since using cookies

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Redirect to login on 401, EXCEPT for login/register endpoints where we want to handle the error locally
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/users/login') || error.config?.url?.includes('/users/register');
      if (!isAuthEndpoint) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;