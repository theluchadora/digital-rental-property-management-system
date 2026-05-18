import { WebSocketServer, WebSocket } from "ws";
import { Invoice, Notification } from "@prisma/client";
import http from "http";



const users = new Map<string, WebSocket>();

export const initWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("WS connected");

    ws.on("message", (message) => {
      const data: any = JSON.parse(message.toString());

      // REGISTER USER
      if (data.type === "REGISTER") {
        users.set(data.userId, ws);
        console.log("User registered:", data.userId);
      }
    });

    ws.on("close", () => {
      for (const [userId, socket] of users.entries()) {
        if (socket === ws) {
          users.delete(userId);
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