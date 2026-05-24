import prisma from "../config/db";
import bcrypt from "bcrypt";
import {
  fromAdminAccountStatus,
  mapAdminLease,
  mapAdminMaintenance,
  mapAdminProperty,
  mapAdminUser,
  adminStatusToProperty,
} from "../utils/adminMappers";
import * as incidentsService from "./incidentsService";

const SALT_ROUNDS = 10;

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalOwners,
    totalTenants,
    totalAdmins,
    suspendedUsers,
    totalProperties,
    totalLeases,
    activeLeases,
    pendingInvoices,
    openMaintenance,
    unreadNotifications,
    openIncidents,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.property.count({ where: { parentId: null } }),
    prisma.lease.count(),
    prisma.lease.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.count({
      where: { status: { in: ["UNPAID", "OVERDUE", "PENDING_REVIEW"] } },
    }),
    prisma.maintenance.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.incidentReport.count({ where: { status: "OPEN" } }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { amountPaid: true },
    }),
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const paidInvoices = await prisma.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: sixMonthsAgo } },
    select: { paidAt: true, amountPaid: true },
  });

  const monthLabels: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en", { month: "short" });
    const sum = paidInvoices
      .filter((inv) => {
        if (!inv.paidAt) return false;
        const p = inv.paidAt;
        return p.getFullYear() === d.getFullYear() && p.getMonth() === d.getMonth();
      })
      .reduce((acc, inv) => acc + Number(inv.amountPaid), 0);
    monthLabels.push({ month: label, revenue: sum });
  }

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });

  const maintenanceByStatus = await prisma.maintenance.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const recentLeases = await prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tenant: {
        select: { firstName: true, lastName: true },
      },
      property: { select: { title: true } },
    },
  });

  const recentMaintenance = await prisma.maintenance.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      property: { select: { title: true } },
    },
  });

  return {
    totalUsers,
    totalOwners,
    totalTenants,
    totalAdmins,
    suspendedUsers,
    totalProperties,
    totalLeases,
    activeLeases,
    totalRevenue: Number(revenueAgg._sum.amountPaid ?? 0),
    pendingInvoices,
    openMaintenance,
    unreadNotifications,
    openIncidents,
    monthlyRevenue: monthLabels,
    usersByRole: usersByRole.map((r) => ({
      role: r.role,
      count: r._count.role,
    })),
    maintenanceByStatus: maintenanceByStatus.map((m) => ({
      status: m.status,
      count: m._count.status,
    })),
    systemHealth: {
      database: "healthy",
      api: "healthy",
      monthStart: startOfMonth().toISOString(),
    },
    recentActivity: [
      ...recentUsers.map((u) => ({
        type: "user" as const,
        id: u.id,
        title: `${u.firstName} ${u.lastName} joined`,
        subtitle: u.role,
        at: u.createdAt.toISOString(),
      })),
      ...recentLeases.map((l) => ({
        type: "lease" as const,
        id: l.id,
        title: `Lease: ${l.property.title}`,
        subtitle: `${l.tenant.firstName} ${l.tenant.lastName} · ${l.status}`,
        at: l.createdAt.toISOString(),
      })),
      ...recentMaintenance.map((m) => ({
        type: "maintenance" as const,
        id: m.id,
        title: m.title,
        subtitle: `${m.property.title} · ${m.status}`,
        at: m.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12),
  };
};

export const listAllUsers = async (params?: {
  role?: string;
  status?: string;
  q?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (params?.role) where.role = params.role;
  if (params?.status) where.isActive = fromAdminAccountStatus(params.status);
  if (params?.q) {
    where.OR = [
      { email: { contains: params.q, mode: "insensitive" } },
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return users.map(mapAdminUser);
};

export const updateUserStatus = async (id: string, accountStatus: string) => {
  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: fromAdminAccountStatus(accountStatus) },
  });
  return mapAdminUser(updated);
};

export const bulkUpdateUserStatus = async (
  userIds: string[],
  accountStatus: string
) => {
  const result = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { isActive: fromAdminAccountStatus(accountStatus) },
  });
  return { count: result.count };
};

export const deleteUser = async (id: string) => {
  await prisma.user.delete({ where: { id } });
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  const result = await prisma.user.deleteMany({
    where: { id: { in: userIds }, role: { not: "ADMIN" } },
  });
  return { count: result.count };
};

export const createAdminUser = async (input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  middleName?: string;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new Error("Email already in use");

  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: hash,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      phoneNumber: input.phoneNumber,
      role: "ADMIN",
      isActive: true,
    },
  });
  return mapAdminUser(user);
};

export const listAllProperties = async () => {
  const properties = await prisma.property.findMany({
    where: { parentId: null },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: true,
      photos: { take: 1, orderBy: { uploadedAt: "asc" } },
    },
  });
  return properties.map((p) => mapAdminProperty(p));
};

export const bulkUpdatePropertyStatus = async (
  propertyIds: string[],
  status: string
) => {
  const mapped = adminStatusToProperty(status);
  if (mapped === "DELETE") {
    const result = await prisma.property.deleteMany({
      where: { id: { in: propertyIds } },
    });
    return { count: result.count };
  }
  const result = await prisma.property.updateMany({
    where: { id: { in: propertyIds } },
    data: { status: mapped },
  });
  return { count: result.count };
};

export const bulkDeleteProperties = async (propertyIds: string[]) => {
  const result = await prisma.property.deleteMany({
    where: { id: { in: propertyIds } },
  });
  return { count: result.count };
};

export const listAllLeases = async () => {
  const leases = await prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      tenant: true,
      documents: true,
    },
  });
  return leases.map(mapAdminLease);
};

export const bulkUpdateLeaseStatus = async (
  leaseIds: string[],
  status: string
) => {
  const result = await prisma.lease.updateMany({
    where: { id: { in: leaseIds } },
    data: { status: status as "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED" },
  });
  return { count: result.count };
};

export const listAllInvoices = async () => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lease: {
        include: {
          property: true,
          tenant: true,
          documents: true,
        },
      },
      tenant: true,
      reviewedBy: true,
      receipts: true,
    },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    leaseId: inv.leaseId,
    billingMonth: inv.billingMonth.toISOString(),
    amountDue: Number(inv.amountDue),
    dueDate: inv.dueDate.toISOString(),
    status: inv.status,
    reviewNote: inv.reviewNote,
    reviewedBy: inv.reviewedById,
    reviewedAt: inv.reviewedAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    lease: mapAdminLease(inv.lease),
    receipts: inv.receipts.map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      filePath: r.fileUrl,
      transactionRef: r.transactionRef,
      paymentMethod: null,
      uploadedBy: r.uploadedBy,
      createdAt: r.uploadedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    reviewer: inv.reviewedBy ? mapAdminUser(inv.reviewedBy) : undefined,
  }));
};

export const listAllMaintenance = async () => {
  const items = await prisma.maintenance.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: { include: { owner: true } },
      createdByUser: true,
      evidence: true,
    },
  });
  return items.map(mapAdminMaintenance);
};

export const listAllMessages = async () => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { sender: true, receiver: true },
  });
  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    subject: m.subject ?? "",
    content: m.content,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.createdAt.toISOString(),
    sender: mapAdminUser(m.sender),
    receiver: mapAdminUser(m.receiver),
  }));
};

export const listAllNotifications = async () => {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });
  return notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.content,
    entityType: n.type,
    entityId: n.invoiceId ?? n.leaseId ?? n.messageId ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.createdAt.toISOString(),
    user: mapAdminUser(n.user),
  }));
};

export const listAdminIncidents = async (params: {
  status?: string;
  urgency?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.urgency) where.urgency = params.urgency;

  const result = await incidentsService.listIncidents(where, page, limit);
  return result;
};

export const getAdminIncident = async (id: string) => {
  const report = await incidentsService.getIncidentById(id);
  if (!report) return null;
  return { report };
};

export const updateAdminIncidentStatus = async (
  id: string,
  data: { status: string; adminNote?: string },
  adminId: string
) => {
  const report = await incidentsService.updateIncidentStatus(id, {
    status: data.status,
    adminNote: data.adminNote,
    resolvedBy: adminId,
  });
  return { report };
};

export const getReportsOverview = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    paidThisMonth,
    paidYtd,
    outstanding,
    leasesByStatus,
    propertiesByStatus,
    invoicesByStatus,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart } },
      _sum: { amountPaid: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: yearStart } },
      _sum: { amountPaid: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["UNPAID", "OVERDUE"] } },
      _sum: { amountDue: true },
      _count: true,
    }),
    prisma.lease.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.property.groupBy({
      by: ["status"],
      where: { parentId: null },
      _count: { status: true },
    }),
    prisma.invoice.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const topOwners = await prisma.invoice.groupBy({
    by: ["leaseId"],
    where: { status: "PAID", paidAt: { gte: yearStart } },
    _sum: { amountPaid: true },
    orderBy: { _sum: { amountPaid: "desc" } },
    take: 10,
  });

  const leaseIds = topOwners.map((t) => t.leaseId);
  const leases = await prisma.lease.findMany({
    where: { id: { in: leaseIds } },
    include: { owner: { select: { id: true, firstName: true, lastName: true } } },
  });
  const leaseOwnerMap = new Map(leases.map((l) => [l.id, l.owner]));

  const ownerRevenue: Record<string, { name: string; revenue: number }> = {};
  for (const row of topOwners) {
    const owner = leaseOwnerMap.get(row.leaseId);
    if (!owner) continue;
    const key = owner.id;
    if (!ownerRevenue[key]) {
      ownerRevenue[key] = {
        name: `${owner.firstName} ${owner.lastName}`,
        revenue: 0,
      };
    }
    ownerRevenue[key].revenue += Number(row._sum.amountPaid ?? 0);
  }

  return {
    revenueThisMonth: Number(paidThisMonth._sum.amountPaid ?? 0),
    paidInvoicesThisMonth: paidThisMonth._count,
    revenueYtd: Number(paidYtd._sum.amountPaid ?? 0),
    outstandingAmount: Number(outstanding._sum.amountDue ?? 0),
    outstandingCount: outstanding._count,
    leasesByStatus: leasesByStatus.map((l) => ({
      status: l.status,
      count: l._count.status,
    })),
    propertiesByStatus: propertiesByStatus.map((p) => ({
      status: p.status,
      count: p._count.status,
    })),
    invoicesByStatus: invoicesByStatus.map((i) => ({
      status: i.status,
      count: i._count.status,
    })),
    topOwnersByRevenue: Object.values(ownerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
  };
};
