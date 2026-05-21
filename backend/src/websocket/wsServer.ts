import { WebSocketServer, WebSocket } from "ws";
import { Invoice, Notification } from "@prisma/client";
import http from "http";



const users = new Map<string, WebSocket>();

export const initWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    console.log("WS connected");

    // Register user via query param if available
    try {
      const url = new URL(req.url || "", "ws://localhost");
      const userId = url.searchParams.get("userId");
      if (userId) {
        users.set(userId, ws);
        console.log("User registered via URL query:", userId);
      }
    } catch (err) {
      console.error("Failed to parse user registration query:", err);
    }

    ws.on("message", (message) => {
      try {
        const data: any = JSON.parse(message.toString());

        // REGISTER USER
        if (data.type === "REGISTER") {
          users.set(data.userId, ws);
          console.log("User registered via message:", data.userId);
        } else if (data.type === "SEND_MESSAGE") {
          const { senderId, receiverId, subject, content, tempId } = data.payload;
          // Dynamically require to avoid circular dependency
          const messagesService = require("../services/messagesService");
          messagesService.sendMessage(senderId, receiverId, subject, content, tempId)
            .catch((err: any) => console.error("Failed to send WS message", err));
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    });

    ws.on("close", () => {
      for (const [userId, socket] of users.entries()) {
        if (socket === ws) {
          users.delete(userId);
          console.log("User disconnected:", userId);
          break;
        }
      }
    });
  });

  return wss;
};

export const sendToUser = (userId: string, message: any) => {
  const ws = users.get(userId);
  if (!ws) return;

  ws.send(JSON.stringify(message));
};