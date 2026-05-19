import { Prisma, NotificationType } from "@prisma/client";
import * as announcementsRepo from "../repositories/announcementsRepository";
import * as leasesRepo from "../repositories/leasesRepository";
import * as notificationsService from "./notificationsService";

export const createAnnouncement = async (input: {
  ownerId: string;
  propertyId?: string;
  title: string;
  content: string;
}) => {
  const announcement = await announcementsRepo.createAnnouncement({
    owner: { connect: { id: input.ownerId } },
    property: input.propertyId ? { connect: { id: input.propertyId } } : undefined,
    title: input.title,
    content: input.content,
  } as Prisma.AnnouncementCreateInput);

  // Notify tenants under the owner's leases
  try {
    const leases = await leasesRepo.getLeasesByOwnerId(input.ownerId);
    const tenantIds = Array.from(new Set(leases.map((l) => l.tenantId)));
    await Promise.all(
      tenantIds.map((tenantId) =>
        notificationsService.createNotification({
          userId: tenantId,
          type: NotificationType.ANNOUNCEMENT,
          title: input.title,
          content: input.content,
        })
      )
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to notify tenants for announcement", err);
  }

  return announcement;
};

export const listAnnouncements = async (
  where: Prisma.AnnouncementWhereInput,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    announcementsRepo.listAnnouncements(where, skip, limit),
    announcementsRepo.countAnnouncements(where),
  ]);

  return {
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
