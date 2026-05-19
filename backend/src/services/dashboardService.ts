import prisma from "../config/db";

export const getOwnerStats = async (ownerId: string) => {
  const propertiesCount = await prisma.property.count({ where: { ownerId } });
  const unitsCount = await prisma.property.count({ where: { ownerId, type: 'UNIT' } });
  const activeLeasesCount = await prisma.lease.count({ where: { ownerId, status: 'ACTIVE' } });

  // Simple urgent maintenance count
  const urgentRequestsCount = await prisma.maintenance.count({ where: { property: { ownerId }, priority: 'URGENT' } });

  return {
    propertiesCount,
    unitsCount,
    occupancyRate: 0,
    activeLeasesCount,
    urgentRequestsCount,
    revenueMTD: 0,
    monthlyRevenue: [],
  };
};

export const getTenantStats = async (tenantId: string) => {
  // current rent from active lease
  const lease = await prisma.lease.findFirst({ where: { tenantId, status: 'ACTIVE' } });
  const currentRentAmount = lease?.monthlyRent ? Number(lease.monthlyRent) : 0;

  // next unpaid invoice
  const nextInvoice = await prisma.invoice.findFirst({ where: { tenantId, status: 'UNPAID' }, orderBy: { dueDate: 'asc' } });
  const daysUntilDue = nextInvoice ? Math.ceil((nextInvoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const pendingRequestsCount = await prisma.maintenance.count({ where: { createdBy: tenantId, status: { not: 'RESOLVED' } } });
  const unreadMessagesCount = await prisma.message.count({ where: { receiverId: tenantId, isRead: false } });

  return {
    currentRentAmount,
    daysUntilDue,
    pendingRequestsCount,
    unreadMessagesCount,
  };
};

export const getActivities = async (userId: string) => {
  // Minimal activity feed: recent announcements and maintenance for user's properties/created
  const announcements = await prisma.announcement.findMany({ where: { ownerId: userId }, take: 10, orderBy: { createdAt: 'desc' } });
  const maintenance = await prisma.maintenance.findMany({ where: { createdBy: userId }, take: 10, orderBy: { createdAt: 'desc' } });

  return { announcements, maintenance };
};

export default { getOwnerStats, getTenantStats, getActivities };
