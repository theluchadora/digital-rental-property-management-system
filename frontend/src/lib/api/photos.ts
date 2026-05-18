import apiClient from "@/lib/api-client";
import type { PropertyPhoto, ApiResponse } from "@/types/api";

export const photosApi = {
  // Upload a photo to a property
  upload: async (propertyId: string, url: string): Promise<ApiResponse<PropertyPhoto>> => {
    const response = await apiClient.post("/photos", { propertyId, url });
    return response.data;
  },

  // Get all photos for a property
  getByProperty: async (propertyId: string): Promise<ApiResponse<PropertyPhoto[]>> => {
    const response = await apiClient.get(`/photos/property/${propertyId}`);
    return response.data;
  },

  // Delete a photo
  delete: async (photoId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/photos/${photoId}`);
    return response.data;
  },

  // Update photo URL
  update: async (photoId: string, url: string): Promise<ApiResponse<PropertyPhoto>> => {
    const response = await apiClient.patch(`/photos/${photoId}`, { url });
    return response.data;
  },
};

export default photosApi;