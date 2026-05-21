import * as messagesRepository from "../repositories/messagesRepository";
import * as notificationsRepository from "../repositories/notificationsRepository";
import { sendToUser } from "../websocket/wsServer";
import { getUserById } from "../repositories/usersRepository";
import { Message } from "@prisma/client";

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  subject: string,
  content: string,
  tempId?: string
): Promise<Message> => {
  // Create message in DB
  const message = await messagesRepository.createMessage({
    senderId,
    receiverId,
    subject,
    content,
  });

  // Get sender details for notification/message format
  const sender = await getUserById(senderId);
  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Someone";

  // Create notifications in DB
  await notificationsRepository.createNotification({
    user: { connect: { id: receiverId } },
    type: "MESSAGE",
    title: `New Message from ${senderName}`,
    content: content.length > 60 ? `${content.substring(0, 60)}...` : content,
    isRead: false,
    messageId: message.id,
  });

  // Send message live via WebSocket to receiver
  sendToUser(receiverId, {
    type: "NEW_MESSAGE",
    data: { ...message, tempId },
  });

  // Send message live via WebSocket to sender (for instant UI update and tempId replacement)
  sendToUser(senderId, {
    type: "NEW_MESSAGE",
    data: { ...message, tempId },
  });

  // Send notification live via WebSocket
  sendToUser(receiverId, {
    type: "NEW_NOTIFICATION",
    data: {
      type: "MESSAGE",
      title: `New Message from ${senderName}`,
      message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
      entityType: "MESSAGE",
      entityId: message.id,
    },
  });

  return message;
};

export const getMessages = async (
  userId1: string,
  userId2: string,
  limit: number = 100,
  page: number = 1
) => {
  return messagesRepository.getMessagesBetweenUsers(userId1, userId2, limit, page);
};

export const getMessage = async (messageId: string) => {
  return messagesRepository.getMessageById(messageId);
};

export const markRead = async (messageId: string) => {
  return messagesRepository.markMessageAsRead(messageId);
};

export const getConversations = async (userId: string) => {
  return messagesRepository.getConversationsForUser(userId);
};
