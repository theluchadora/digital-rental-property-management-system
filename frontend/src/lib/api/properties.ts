// lib/api/properties.ts
import apiClient from "@/lib/api-client";
import type { Property, CreatePropertyPayload, UpdatePropertyPayload, ApiResponse, PropertyPhoto } from "@/types/api";

export const propertiesApi = {
  // Create a property
  create: async (payload: CreatePropertyPayload): Promise<ApiResponse<Property>> => {
    const response = await apiClient.post("/properties", payload);
    return response.data;
  },

  // Get all properties (paginated API; pass a high limit for portfolio views)
  /** Alias for getAll — used by announcements/reports */
  list: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    type?: string;
    status?: string;
  }) => {
    const response = await apiClient.get("/properties", {
      params: { page: 1, limit: 500, ...params },
    });
    return { data: response.data };
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    type?: string;
    status?: string;
  }): Promise<{ data: Property[]; total?: number; page?: number; totalPages?: number } | Property[]> => {
    const response = await apiClient.get("/properties", {
      params: { page: 1, limit: 500, ...params },
    });
    return response.data;
  },

  // Get vacant properties
  getVacant: async (): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get("/properties/vacant");
    return response.data;
  },

  // Get properties by owner
  getByOwner: async (ownerId: string): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get(`/properties/owner/${ownerId}`);
    return response.data;
  },

  // Get single property
  getById: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  // Update property
  update: async (id: string, payload: UpdatePropertyPayload): Promise<ApiResponse<Property>> => {
    const response = await apiClient.patch(`/properties/${id}`, payload);
    return response.data;
  },

  // Get units under property
  getUnits: async (propertyId: string): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get(`/properties/${propertyId}/units`);
    return response.data;
  },

  // Get vacant units under property
  getVacantUnits: async (propertyId: string): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get(`/properties/${propertyId}/units/vacant`);
    return response.data;
  },

  // Upload photo (expects a URL already stored in Cloudinary or similar)
  uploadPhoto: async (propertyId: string, url: string): Promise<ApiResponse<PropertyPhoto>> => {
    const response = await apiClient.post("/photos", { propertyId, url });
    return response.data;
  },

  // Delete photo
  deletePhoto: async (photoId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/properties/photos/${photoId}`);
    return response.data;
  },

  
};