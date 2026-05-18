import apiClient from "@/lib/api-client";

export interface OwnerStats {
  propertiesCount: number;
  unitsCount: number;
  occupancyRate: number;
  activeLeasesCount: number;
  urgentRequestsCount: number;
  revenueMTD: number;
  monthlyRevenue?: { month: string; revenue: number }[];
}

export interface TenantStats {
  currentRentAmount: number;
  daysUntilDue: number;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
}

export const dashboardApi = {
  getOwnerStats: () =>
    apiClient.get<OwnerStats>("/dashboard/owner/stats").then(res => res.data),

  getTenantStats: () =>
    apiClient.get<TenantStats>("/dashboard/tenant/stats").then(res => res.data),

  getActivities: () =>
    apiClient.get<unknown>("/dashboard/activities").then(res => res.data),
};
