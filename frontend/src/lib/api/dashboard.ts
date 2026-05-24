import apiClient from "@/lib/api-client";

export interface OwnerStats {
  propertiesCount: number;
  unitsCount: number;
  occupancyRate: number;
  activeLeasesCount: number;
  pendingApplicationsCount: number;
  urgentRequestsCount: number;
  openMaintenanceCount: number;
  revenueMTD: number;
  unpaidInvoicesCount: number;
  unreadMessagesCount: number;
}

export interface PropertyPerformanceRow {
  id: string;
  name: string;
  location: string;
  status: string;
  occupancy: number;
  monthlyRent: number | null;
  tenantName: string | null;
  pendingApplication: boolean;
  imageUrl: string | null;
}

export interface DashboardActivity {
  id: string;
  type: "lease" | "maintenance" | "payment";
  title: string;
  desc: string;
  time: string;
  href: string;
  badge?: string;
}

export interface OwnerOverview {
  stats: OwnerStats;
  propertyPerformance: PropertyPerformanceRow[];
  activities: DashboardActivity[];
}

export interface TenantActiveLease {
  id: string;
  monthlyRent: number;
  depositAmount: number | null;
  startDate: string;
  endDate: string;
  status: string;
  property: {
    id: string;
    title: string;
    address: string | null;
    city: string | null;
  };
}

export interface TenantStats {
  currentRentAmount: number;
  daysUntilDue: number | null;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  activeLease: TenantActiveLease | null;
}

export const dashboardApi = {
  getOwnerStats: () =>
    apiClient.get<OwnerStats>("/dashboard/owner/stats").then((res) => res.data),

  getOwnerOverview: () =>
    apiClient.get<OwnerOverview>("/dashboard/owner/overview").then((res) => res.data),

  getTenantStats: () =>
    apiClient.get<TenantStats>("/dashboard/tenant/stats").then((res) => res.data),

  getActivities: () =>
    apiClient.get<unknown>("/dashboard/activities").then((res) => res.data),
};
