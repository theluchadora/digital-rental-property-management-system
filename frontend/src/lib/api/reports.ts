import apiClient from "@/lib/api-client";

export interface CashFlowReport {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeByProperty: Record<string, number>;
  expensesByProperty: Record<string, number>;
}

export interface PropertyStats {
  propertyId: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeLeases: number;
  totalRevenue: number;
  pendingRevenue: number;
  openMaintenanceRequests: number;
}

export const reportsApi = {
  getCashFlow: (params: { startDate: string; endDate: string; propertyId?: string }) =>
    apiClient.get<CashFlowReport>("/reports/cash-flow", { params }).then(res => res.data),

  getPropertyStats: (propertyId: string) =>
    apiClient.get<PropertyStats>(`/reports/property/${propertyId}`).then(res => res.data),
};
