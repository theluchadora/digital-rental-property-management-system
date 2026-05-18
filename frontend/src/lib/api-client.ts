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
    // Redirect to login on 401
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;