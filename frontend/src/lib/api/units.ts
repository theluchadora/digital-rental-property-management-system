// lib/api/units.ts
import apiClient from "@/lib/api-client";
import type { RentalUnit, CreateUnitPayload, ApiResponse } from "@/types/api";

export interface UnitsListParams {
  city?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  status?: string;
}

export const unitsApi = {
  // List units with filters
  list: async (params?: UnitsListParams): Promise<ApiResponse<{ units: RentalUnit[] }>> => {
    const response = await apiClient.get("/api/units", { params });
    return response.data;
  },

  // Get single unit
  getById: async (id: string): Promise<ApiResponse<{ unit: RentalUnit }>> => {
    const response = await apiClient.get(`/api/units/${id}`);
    return response.data;
  },

  // Create unit under property
  create: async (propertyId: string, payload: CreateUnitPayload): Promise<ApiResponse<{ unit: RentalUnit }>> => {
    const response = await apiClient.post(`/api/properties/${propertyId}/units`, payload);
    return response.data;
  },

  // Update unit
  update: async (id: string, payload: Partial<CreateUnitPayload>): Promise<ApiResponse<{ unit: RentalUnit }>> => {
    const response = await apiClient.patch(`/api/units/${id}`, payload);
    return response.data;
  },

  // Delete unit
  delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.delete(`/api/units/${id}`);
    return response.data;
  },
};