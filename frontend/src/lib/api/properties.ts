// lib/api/properties.ts
import apiClient from "@/lib/api-client";
import type { Property, CreatePropertyPayload, UpdatePropertyPayload, ApiResponse, PropertyPhoto } from "@/types/api";

export const propertiesApi = {
  // Create a property
  create: async (payload: CreatePropertyPayload): Promise<ApiResponse<Property>> => {
    const response = await apiClient.post("/properties", payload);
    return response.data;
  },

  // Get all properties
  getAll: async (): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get("/properties");
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

  // Upload photo
  uploadPhoto: async (propertyId: string, file: File): Promise<ApiResponse<PropertyPhoto>> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/properties/${propertyId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Delete photo
  deletePhoto: async (photoId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/properties/photos/${photoId}`);
    return response.data;
  },

  
};