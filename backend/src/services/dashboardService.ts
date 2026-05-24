import prisma from "../config/db";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const getOwnerStats = async (ownerId: string) => {
  const propertiesCount = await prisma.property.count({
    where: { ownerId, parentId: null },
  });

  const rentableCount = await prisma.property.count({
    where: {
      ownerId,
      OR: [{ parentId: { not: null } }, { type: { in: ["HOUSE", "UNIT", "VEHICLE"] } }],
    },
  });

  const occupiedCount = await prisma.property.count({
    where: { ownerId, status: "OCCUPIED" },
  });

  const activeLeasesCount = await prisma.lease.count({
    where: { ownerId, status: "ACTIVE" },
  });

  const pendingApplicationsCount = await prisma.lease.count({
    where: { ownerId, status: "INITIATED" },
  });

  const urgentRequestsCount = await prisma.maintenance.count({
    where: {
      property: { ownerId },
      priority: "URGENT",
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const openMaintenanceCount = await prisma.maintenance.count({
    where: {
      property: { ownerId },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const monthStart = startOfMonth();
  const revenueAgg = await prisma.invoice.aggregate({
    where: {
      status: "PAID",
      paidAt: { gte: monthStart },
      lease: { ownerId },
    },
    _sum: { amountPaid: true },
  });

  const unpaidInvoicesCount = await prisma.invoice.count({
    where: {
      status: { in: ["UNPAID", "OVERDUE"] },
      lease: { ownerId },
    },
  });

  const unreadMessagesCount = await prisma.message.count({
    where: { receiverId: ownerId, isRead: false },
  });

  const occupancyRate =
    rentableCount > 0 ? Math.round((occupiedCount / rentableCount) * 100) : 0;

  return {
    propertiesCount,
    unitsCount: rentableCount,
    occupancyRate,
    activeLeasesCount,
    pendingApplicationsCount,
    urgentRequestsCount,
    openMaintenanceCount,
    revenueMTD: Number(revenueAgg._sum.amountPaid ?? 0),
    unpaidInvoicesCount,
    unreadMessagesCount,
  };
};

export const getOwnerOverview = async (ownerId: string) => {
  const stats = await getOwnerStats(ownerId);

  const properties = await prisma.property.findMany({
    where: { ownerId, parentId: null },
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: {
      photos: { take: 1, orderBy: { uploadedAt: "asc" } },
      leases: {
        where: { status: { in: ["ACTIVE", "INITIATED", "AWAITINGPAYMENT"] } },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  const propertyPerformance = properties.map((p) => {
    const activeLease = p.leases.find((l) => l.status === "ACTIVE");
    const pendingLease = p.leases.find((l) => l.status !== "ACTIVE");
    const occupied = p.status === "OCCUPIED" || !!activeLease;
    const location = [p.city, p.state].filter(Boolean).join(", ") || p.address || "—";
    return {
      id: p.id,
      name: p.title,
      location,
      status: p.status,
      occupancy: occupied ? 100 : 0,
      monthlyRent: activeLease ? Number(activeLease.monthlyRent) : null,
      tenantName: activeLease?.tenant
        ? `${activeLease.tenant.firstName} ${activeLease.tenant.lastName}`
        : pendingLease?.tenant
          ? `${pendingLease.tenant.firstName} ${pendingLease.tenant.lastName}`
          : null,
      pendingApplication: !!pendingLease && !activeLease,
      imageUrl: p.photos[0]?.url ?? null,
    };
  });

  const [recentLeases, recentMaintenance, recentInvoices] = await Promise.all([
    prisma.lease.findMany({
      where: { ownerId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { title: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.maintenance.findMany({
      where: { property: { ownerId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true } } },
    }),
    prisma.invoice.findMany({
      where: { lease: { ownerId } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        lease: { include: { property: { select: { title: true } } } },
      },
    }),
  ]);

  type ActivityItem = {
    id: string;
    type: "lease" | "maintenance" | "payment";
    title: string;
    desc: string;
    time: string;
    href: string;
    badge?: string;
  };

  const activities: ActivityItem[] = [
    ...recentLeases.map((l) => ({
      id: `lease-${l.id}`,
      type: "lease" as const,
      title:
        l.status === "INITIATED"
          ? "New lease application"
          : `Lease ${l.status.toLowerCase()}`,
      desc: `${l.tenant.firstName} ${l.tenant.lastName} · ${l.property.title}`,
      time: l.createdAt.toISOString(),
      href: `/leases/${l.id}`,
      badge: l.status === "INITIATED" ? "Review" : undefined,
    })),
    ...recentMaintenance.map((m) => ({
      id: `maint-${m.id}`,
      type: "maintenance" as const,
      title: m.priority === "URGENT" ? "Urgent maintenance" : "Maintenance request",
      desc: `${m.title} · ${m.property.title}`,
      time: m.createdAt.toISOString(),
      href: "/maintenance",
      badge: m.priority === "URGENT" ? "Urgent" : undefined,
    })),
    ...recentInvoices.map((inv) => ({
      id: `inv-${inv.id}`,
      type: "payment" as const,
      title: inv.status === "PAID" ? "Payment received" : "Invoice update",
      desc: `${inv.tenant.firstName} ${inv.tenant.lastName} · ${inv.lease.property.title}`,
      time: (inv.paidAt ?? inv.createdAt).toISOString(),
      href: "/payments",
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return { stats, propertyPerformance, activities };
};

export const getTenantStats = async (tenantId: string) => {
  const lease = await prisma.lease.findFirst({
    where: { tenantId, status: "ACTIVE" },
    include: {
      property: {
        include: { photos: { take: 1, orderBy: { uploadedAt: "asc" } } },
      },
    },
  });
  const currentRentAmount = lease?.monthlyRent ? Number(lease.monthlyRent) : 0;

  const nextInvoice = await prisma.invoice.findFirst({
    where: { tenantId, status: "UNPAID" },
    orderBy: { dueDate: "asc" },
  });
  const daysUntilDue = nextInvoice
    ? Math.ceil((nextInvoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const pendingRequestsCount = await prisma.maintenance.count({
    where: { createdBy: tenantId, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
  });

  const unreadMessagesCount = await prisma.message.count({
    where: { receiverId: tenantId, isRead: false },
  });

  const activeLease = lease
    ? {
        id: lease.id,
        monthlyRent: Number(lease.monthlyRent),
        depositAmount: lease.depositAmount ? Number(lease.depositAmount) : null,
        startDate: lease.startDate.toISOString(),
        endDate: lease.endDate.toISOString(),
        status: lease.status,
        property: {
          id: lease.property.id,
          title: lease.property.title,
          address: lease.property.address,
          city: lease.property.city,
        },
      }
    : null;

  return {
    currentRentAmount,
    daysUntilDue,
    pendingRequestsCount,
    unreadMessagesCount,
    activeLease,
  };
};

export const getActivities = async (userId: string) => {
  const announcements = await prisma.announcement.findMany({
    where: { ownerId: userId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  const maintenance = await prisma.maintenance.findMany({
    where: { createdBy: userId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return { announcements, maintenance };
};

export default { getOwnerStats, getOwnerOverview, getTenantStats, getActivities };
