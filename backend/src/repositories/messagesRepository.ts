import prisma from "../config/db";
import { Prisma, Message } from "@prisma/client";

export const createMessage = async (
  data: Prisma.MessageUncheckedCreateInput
): Promise<Message> => {
  return prisma.message.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });
};

export const getMessagesBetweenUsers = async (
  userId1: string,
  userId2: string,
  limit: number = 100,
  page: number = 1
): Promise<{ data: Message[]; total: number }> => {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.MessageWhereInput = {
    OR: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    }),
    prisma.message.count({ where: whereClause }),
  ]);

  return { data, total };
};

export const getMessageById = async (messageId: string): Promise<Message | null> => {
  return prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });
};

/** Mark all messages from otherUserId to userId as read */
export const markMessagesAsReadBetweenUsers = async (
  userId: string,
  otherUserId: string
): Promise<number> => {
  const result = await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      OR: [{ readAt: null }, { isRead: false }],
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
  return result.count;
};

export const markMessageAsRead = async (messageId: string): Promise<Message> => {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });
};

export const getConversationsForUser = async (userId: string): Promise<any[]> => {
  // Find all unique counterparts who exchanged messages with the user
  const sentTo = await prisma.message.findMany({
    where: { senderId: userId },
    distinct: ["receiverId"],
    select: { receiverId: true },
  });

  const receivedFrom = await prisma.message.findMany({
    where: { receiverId: userId },
    distinct: ["senderId"],
    select: { senderId: true },
  });

  const partnerIds = Array.from(
    new Set([
      ...sentTo.map((m) => m.receiverId),
      ...receivedFrom.map((m) => m.senderId),
    ])
  );

  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      // Find latest message between them
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImageUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      });

      // Find partner user details
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      });

      // Find if there is an active lease to identify property context
      const lease = await prisma.lease.findFirst({
        where: {
          OR: [
            { tenantId: userId, ownerId: partnerId },
            { tenantId: partnerId, ownerId: userId },
          ],
          status: "ACTIVE",
        },
        include: {
          property: true,
        },
      });

      const participantA = userId < partnerId ? partner : { id: userId }; // placeholder or fully resolved user
      const participantB = userId < partnerId ? { id: userId } : partner;

      // Determine correct participants order based on ID alphabetical sort
      const isALessThanB = userId < partnerId;

      return {
        id: isALessThanB ? `${userId}_${partnerId}` : `${partnerId}_${userId}`,
        participantAId: isALessThanB ? userId : partnerId,
        participantBId: isALessThanB ? partnerId : userId,
        lastMessageId: lastMessage?.id || null,
        lastMessage: lastMessage,
        property: lease?.property || null,
        createdAt: lastMessage?.createdAt || new Date(),
        updatedAt: lastMessage?.createdAt || new Date(),
        participantA: isALessThanB ? null as any : partner,
        participantB: isALessThanB ? partner : null as any,
      };
    })
  );

  // We need to resolve fully user details for the other participant as well (the current user)
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
    },
  });

  const fullyResolvedConversations = conversations.map((conv) => {
    const isALessThanB = conv.participantAId === userId;
    return {
      ...conv,
      participantA: isALessThanB ? currentUser : conv.participantA,
      participantB: isALessThanB ? conv.participantB : currentUser,
    };
  });

  // Order conversations by latest message first
  return fullyResolvedConversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};
