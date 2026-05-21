import { appConfig } from "./app-config";

type ListenerCallback = (data: unknown) => void;
const listeners = new Map<string, Set<ListenerCallback>>();

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

export function connectWebSocket(userId: string) {
  if (currentUserId === userId && ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  disconnectWebSocket();
  currentUserId = userId;

  let wsUrl = "";
  const apiBaseUrl = appConfig.apiBaseUrl;
  
  if (apiBaseUrl.startsWith("http")) {
    const url = new URL(apiBaseUrl);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${wsProtocol}//${url.host}/ws?userId=${encodeURIComponent(userId)}`;
  } else {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${wsProtocol}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}`;
  }

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected successfully.");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type && listeners.has(payload.type)) {
        listeners.get(payload.type)?.forEach((callback) => callback(payload.data));
      }
    } catch (err) {
      console.error("Error parsing WS message:", err);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected. Attempting reconnection...");
    ws = null;
    if (currentUserId) {
      reconnectTimer = setTimeout(() => {
        connectWebSocket(currentUserId!);
      }, 3000);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    if (ws) {
      ws.close();
    }
  };
}

export function disconnectWebSocket() {
  currentUserId = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

export function subscribeToEvent(type: "NEW_MESSAGE" | "NEW_NOTIFICATION", callback: ListenerCallback) {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type)?.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.get(type)?.delete(callback);
  };
}

export function sendWebSocketMessage(type: string, payload: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
    return true;
  }
  return false;
}
