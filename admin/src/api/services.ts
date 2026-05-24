import apiClient from "./client";
import type {
  AuthResponse,
  User,
  Property,
  Lease,
  Invoice,
  MaintenanceRequest,
  Message,
  Notification,
  AdminStats,
  ReportsOverview,
  PaginatedResponse,
  IncidentReport,
} from "./types";

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<{
      user: User;
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    }>("/users/login", { email, password });
    const { user, accessToken, refreshToken } = res.data;
    return {
      user,
      accessToken: accessToken ?? "session",
      refreshToken: refreshToken ?? "session",
    };
  },
  async me(): Promise<User> {
    const res = await apiClient.get<User>("/users/me");
    return res.data;
  },
  async logout(): Promise<void> {
    await apiClient.post("/users/logout");
  },
};

export const usersApi = {
  list: async (params?: {
    role?: string;
    status?: string;
    q?: string;
  }): Promise<{ users: User[]; total: number }> => {
    const res = await apiClient.get<PaginatedResponse<User>>("/admin/users", {
      params: {
        ...(params?.role && params.role !== "ALL" ? { role: params.role } : {}),
        ...(params?.status && params.status !== "ALL"
          ? { status: params.status }
          : {}),
        ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      },
    });
    const users = Array.isArray(res.data) ? res.data : res.data.data || [];
    const total = Array.isArray(res.data)
      ? res.data.length
      : (res.data.total ?? users.length);
    return { users, total };
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },
  updateStatus: async (
    id: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<void> => {
    await apiClient.put(`/admin/users/${id}/status`, { accountStatus: status });
  },
  bulkUpdateStatus: async (
    ids: string[],
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<{ count: number }> => {
    const res = await apiClient.post<{ count: number }>(
      "/admin/users/bulk-status",
      { userIds: ids, accountStatus: status },
    );
    return res.data;
  },
  bulkDelete: async (ids: string[]): Promise<{ count: number }> => {
    const res = await apiClient.post<{ count: number }>(
      "/admin/users/bulk-delete",
      { userIds: ids },
    );
    return res.data;
  },
  createAdmin: async (
    data: Record<string, unknown>,
  ): Promise<{ user: User }> => {
    const res = await apiClient.post<{ user: User }>(
      "/admin/create-admin",
      data,
    );
    return res.data;
  },
};

export const propertiesApi = {
  list: async (params?: Record<string, unknown>): Promise<Property[]> => {
    const res = await apiClient.get<PaginatedResponse<Property>>(
      "/admin/properties",
      { params },
    );
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
  bulkUpdateStatus: async (
    ids: string[],
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DELETED",
  ): Promise<{ count: number }> => {
    const res = await apiClient.post<{ count: number }>(
      "/admin/properties/bulk-status",
      { propertyIds: ids, status },
    );
    return res.data;
  },
  bulkDelete: async (ids: string[]): Promise<{ count: number }> => {
    const res = await apiClient.post<{ count: number }>(
      "/admin/properties/bulk-delete",
      { propertyIds: ids },
    );
    return res.data;
  },
};

export const leasesApi = {
  list: async (params?: Record<string, unknown>): Promise<Lease[]> => {
    const res = await apiClient.get<PaginatedResponse<Lease>>("/admin/leases", {
      params,
    });
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
  bulkUpdateStatus: async (
    ids: string[],
    status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED",
  ): Promise<{ count: number }> => {
    const res = await apiClient.post<{ count: number }>(
      "/admin/leases/bulk-status",
      { leaseIds: ids, status },
    );
    return res.data;
  },
};

export const invoicesApi = {
  list: async (params?: Record<string, unknown>): Promise<Invoice[]> => {
    const res = await apiClient.get<PaginatedResponse<Invoice>>(
      "/admin/invoices",
      { params },
    );
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
};

export const maintenanceApi = {
  list: async (): Promise<MaintenanceRequest[]> => {
    const res = await apiClient.get<PaginatedResponse<MaintenanceRequest>>(
      "/admin/maintenance",
    );
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
};

export const messagesApi = {
  list: async (): Promise<Message[]> => {
    const res = await apiClient.get<PaginatedResponse<Message>>("/messages");
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
  listSystem: async (): Promise<Message[]> => {
    const res =
      await apiClient.get<PaginatedResponse<Message>>("/admin/messages");
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
};

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res =
      await apiClient.get<PaginatedResponse<Notification>>("/notifications");
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
  listSystem: async (): Promise<Notification[]> => {
    const res = await apiClient.get<PaginatedResponse<Notification>>(
      "/admin/notifications",
    );
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
};

export const statsApi = {
  get: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>("/admin/stats");
    return res.data;
  },
};

export const reportsApi = {
  overview: async (): Promise<ReportsOverview> => {
    const res = await apiClient.get<ReportsOverview>("/admin/reports/overview");
    return res.data;
  },
};

export const incidentsApi = {
  list: async (params?: {
    status?: string;
    urgency?: string;
    page?: number;
    limit?: number;
  }): Promise<IncidentReport[]> => {
    const res = await apiClient.get<PaginatedResponse<IncidentReport>>(
      "/admin/incidents",
      { params },
    );
    // Normalize — backend returns { data, total, page, ... }
    return Array.isArray(res.data) ? res.data : res.data.data || [];
  },
  getById: async (id: string): Promise<IncidentReport> => {
    const res = await apiClient.get<{ report: IncidentReport }>(
      `/admin/incidents/${id}`,
    );
    return res.data.report || (res.data as unknown as IncidentReport);
  },
  updateStatus: async (
    id: string,
    data: { status: string; adminNote?: string },
  ): Promise<IncidentReport> => {
    const res = await apiClient.patch<{ report: IncidentReport }>(
      `/admin/incidents/${id}/status`,
      data,
    );
    return res.data.report || (res.data as unknown as IncidentReport);
  },
};
