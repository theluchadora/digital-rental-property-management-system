import { Request, Response } from "express";
import * as adminService from "../services/adminService";
import { mapAdminUser } from "../utils/adminMappers";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load stats" });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.listAllUsers({
      role: req.query.role as string,
      status: req.query.status as string,
      q: req.query.q as string,
    });
    res.json({ data: users, total: users.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list users" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { accountStatus } = req.body;
    const user = await adminService.updateUserStatus(
      req.params.id as string,
      accountStatus
    );
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update user" });
  }
};

export const removeUser = async (req: Request, res: Response) => {
  try {
    await adminService.deleteUser(req.params.id as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete user" });
  }
};

export const bulkUserStatus = async (req: Request, res: Response) => {
  try {
    const { userIds, accountStatus } = req.body;
    const result = await adminService.bulkUpdateUserStatus(userIds, accountStatus);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk update failed" });
  }
};

export const bulkDeleteUsers = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    const result = await adminService.bulkDeleteUsers(userIds);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk delete failed" });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const user = await adminService.createAdminUser(req.body);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create admin" });
  }
};

export const listProperties = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllProperties();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list properties" });
  }
};

export const bulkPropertyStatus = async (req: Request, res: Response) => {
  try {
    const { propertyIds, status } = req.body;
    const result = await adminService.bulkUpdatePropertyStatus(propertyIds, status);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk update failed" });
  }
};

export const bulkDeleteProperties = async (req: Request, res: Response) => {
  try {
    const { propertyIds } = req.body;
    const result = await adminService.bulkDeleteProperties(propertyIds);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk delete failed" });
  }
};

export const listLeases = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllLeases();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list leases" });
  }
};

export const bulkLeaseStatus = async (req: Request, res: Response) => {
  try {
    const { leaseIds, status } = req.body;
    const result = await adminService.bulkUpdateLeaseStatus(leaseIds, status);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk update failed" });
  }
};

export const listInvoices = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllInvoices();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list invoices" });
  }
};

export const listMaintenance = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllMaintenance();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list maintenance" });
  }
};

export const listMessages = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllMessages();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list messages" });
  }
};

export const listNotifications = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.listAllNotifications();
    res.json({ data, total: data.length, page: 1, totalPages: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list notifications" });
  }
};

export const listIncidents = async (req: Request, res: Response) => {
  try {
    const result = await adminService.listAdminIncidents({
      status: req.query.status as string,
      urgency: req.query.urgency as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list incidents" });
  }
};

export const getIncident = async (req: Request, res: Response) => {
  try {
    const result = await adminService.getAdminIncident(req.params.id as string);
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get incident" });
  }
};

export const patchIncidentStatus = async (req: any, res: Response) => {
  try {
    const result = await adminService.updateAdminIncidentStatus(
      req.params.id as string,
      req.body,
      req.user?.id
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update incident" });
  }
};

export const getReportsOverview = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.getReportsOverview();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load reports" });
  }
};
