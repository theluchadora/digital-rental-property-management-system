import prisma from "../config/db";
import { Prisma, Announcement } from "@prisma/client";

export const createAnnouncement = async (
  data: Prisma.AnnouncementCreateInput
): Promise<Announcement> => {
  return prisma.announcement.create({ data });
};

export const listAnnouncements = async (
  where: Prisma.AnnouncementWhereInput,
  skip: number,
  take: number
): Promise<Announcement[]> => {
  return prisma.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: { owner: true, property: true },
  });
};

export const countAnnouncements = async (
  where: Prisma.AnnouncementWhereInput
): Promise<number> => {
  return prisma.announcement.count({ where });
};
