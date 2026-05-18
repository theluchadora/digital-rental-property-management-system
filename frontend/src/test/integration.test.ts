import { describe, it, expect, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { notificationsApi } from "@/lib/api/notifications";
import { invoicesApi } from "@/lib/api/invoices";
import { leasesApi } from "@/lib/api/leases";
import { maintenanceApi } from "@/lib/api/maintenance";
import { adminApi } from "@/lib/api/admin";
import { announcementsApi } from "@/lib/api/announcements";
import { authApi } from "@/lib/api/auth";
import { messagesApi } from "@/lib/api/messages";
import { propertiesApi } from "@/lib/api/properties";
import { unitsApi } from "@/lib/api/units";
import { incidentsApi } from "@/lib/api/incidents";

vi.mock("@/lib/api-client", () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("Frontend API Client Integration", () => {
  it("fetches notifications", async () => {
    const mockData = { data: { data: [{ id: "1", type: "SYSTEM", message: "Hello" }], total: 1 } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await notificationsApi.list();
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/notifications", { params: undefined });
  });

  it("marks a notification as read", async () => {
    const mockData = { data: { notification: { id: "1", isRead: true } } };
    vi.mocked(apiClient.put).mockResolvedValueOnce(mockData);

    const res = await notificationsApi.markRead("1");
    expect(res).toEqual(mockData);
    expect(apiClient.put).toHaveBeenCalledWith("/notifications/1/read");
  });

  it("fetches invoices", async () => {
    const mockData = { data: { data: [{ id: "inv-1", status: "UNPAID" }], total: 1 } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await invoicesApi.list({ status: "UNPAID" });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/invoices", { params: { status: "UNPAID" } });
  });

  it("fetches leases", async () => {
    const mockData = { data: { data: [{ id: "lease-1", status: "ACTIVE" }], total: 1 } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await leasesApi.list();
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/leases", { params: undefined });
  });

  it("creates maintenance requests", async () => {
    const mockData = { data: { id: "req-1", category: "PLUMBING" } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockData);

    const res = await maintenanceApi.create({
      unitId: "unit-1",
      category: "PLUMBING",
      priority: "HIGH",
      description: "Leaking pipe",
    });
    expect(res).toEqual(mockData);
  });

  it("admin: lists users", async () => {
    const mockData = { data: { data: [{ id: "u-1", email: "test@example.com" }] } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await adminApi.listUsers({ role: "TENANT" });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/admin/users", { params: { role: "TENANT" } });
  });

  it("announcements: lists", async () => {
    const mockData = { data: { data: [{ id: "a-1", title: "Welcome" }] } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await announcementsApi.list({ page: 1 });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/announcements", { params: { page: 1 } });
  });

  it("auth: registers a user", async () => {
    const mockData = { data: { user: { id: "u-2", email: "new@example.com" } } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockData);

    const res = await authApi.register({
      email: "new@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    });
    expect(res).toEqual(mockData);
  });

  it("messages: lists messages in a conversation", async () => {
    const mockData = { data: { data: [{ id: "msg-1", content: "Hi" }] } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await messagesApi.list({ otherUserId: "u-3" });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/messages", { params: { otherUserId: "u-3" } });
  });

  it("properties: fetches property details", async () => {
    const mockData = { data: { property: { id: "p-1", title: "Luxury Apartment" } } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await propertiesApi.getById("p-1");
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/properties/p-1");
  });

  it("units: searches/lists units", async () => {
    const mockData = { data: { data: [{ id: "unit-2", rentAmount: 1200 }] } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await unitsApi.list({ minRent: 1000 });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/units", { params: { minRent: 1000 } });
  });
});

describe("Incidents API Integration", () => {
  it("creates an incident report", async () => {
    const mockData = { data: { report: { id: "inc-1", reportType: "COMPLAINT" } } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockData);

    const res = await incidentsApi.create({
      reportType: "COMPLAINT",
      incidentType: "NOISE",
      urgency: "MEDIUM",
      description: "Loud party",
      location: "Unit 101",
      incidentDate: "2024-05-10",
    });
    expect(res).toEqual(mockData);
  });

  it("lists reports", async () => {
    const mockData = { data: { data: [{ id: "inc-1", status: "OPEN" }], total: 1 } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData);

    const res = await incidentsApi.list({ status: "OPEN" });
    expect(res).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/incidents", { params: { status: "OPEN" } });
  });

  it("admin: updates incident status", async () => {
    const mockData = { data: { report: { id: "inc-1", status: "RESOLVED" } } };
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockData);

    const res = await incidentsApi.adminUpdateStatus("inc-1", { status: "RESOLVED", adminNote: "Fixed" });
    expect(res).toEqual(mockData);
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/incidents/inc-1/status", { status: "RESOLVED", adminNote: "Fixed" });
  });
});
