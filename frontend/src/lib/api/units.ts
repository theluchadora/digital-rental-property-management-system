// lib/api/units.ts
import apiClient from "@/lib/api-client";
import type { Property, CreatePropertyPayload, ApiResponse } from "@/types/api";

export interface UnitsListParams {
  city?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  status?: string;
}

export const unitsApi = {
  // List units with filters
  list: async (params?: UnitsListParams): Promise<{ data: Property[]; total: number; page: number; totalPages: number }> => {
    const response = await apiClient.get("/units", { params });
    return response.data;
  },

  // Get single unit
  getById: async (id: string): Promise<ApiResponse<{ unit: Property }>> => {
    const response = await apiClient.get(`/units/${id}`);
    return response.data;
  },

  // Create unit under property
  create: async (propertyId: string, payload: CreatePropertyPayload): Promise<ApiResponse<{ unit: Property }>> => {
    const response = await apiClient.post(`/properties/${propertyId}/units`, payload);
    return response.data;
  },

  // Update unit
  update: async (id: string, payload: Partial<CreatePropertyPayload>): Promise<ApiResponse<{ unit: Property }>> => {
    const response = await apiClient.patch(`/units/${id}`, payload);
    return response.data;
  },

  // Delete unit
  delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/units/${id}`);
    return response.data;
  },
};