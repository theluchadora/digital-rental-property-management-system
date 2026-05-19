import { Request, Response } from "express";
import * as messagesService from "../services/messagesService";

export const getConversations = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversations = await messagesService.getConversations(userId);
    res.json({ conversations });
  } catch (err: any) {
    console.error("Error caught in messagesController.ts (getConversations):", err);
    res.status(500).json({ error: err.message || "Failed to load conversations" });
  }
};

export const list = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const otherUserId = req.query.otherUserId as string;
    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId query parameter is required" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;

    const { data, total } = await messagesService.getMessages(userId, otherUserId, limit, page);
    
    // Format paginated response matching frontend expectations
    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("Error caught in messagesController.ts (list):", err);
    res.status(500).json({ error: err.message || "Failed to load messages" });
  }
};

export const getById = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const messageId = req.params.messageId;
    const message = await messagesService.getMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to message" });
    }

    res.json({ message });
  } catch (err: any) {
    console.error("Error caught in messagesController.ts (getById):", err);
    res.status(500).json({ error: err.message || "Failed to load message" });
  }
};

export const send = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { receiverId, subject, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ error: "receiverId and content are required" });
    }

    const message = await messagesService.sendMessage(
      userId,
      receiverId,
      subject || "Direct Message",
      content
    );

    res.status(201).json({ message });
  } catch (err: any) {
    console.error("Error caught in messagesController.ts (send):", err);
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
};

export const markRead = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const messageId = req.params.messageId;
    const message = await messagesService.getMessage(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({ error: "Only the receiver can mark a message as read" });
    }

    const updated = await messagesService.markRead(messageId);
    res.json({ message: updated });
  } catch (err: any) {
    console.error("Error caught in messagesController.ts (markRead):", err);
    res.status(500).json({ error: err.message || "Failed to mark message as read" });
  }
};
