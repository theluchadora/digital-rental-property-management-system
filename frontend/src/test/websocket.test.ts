import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { connectWebSocket, disconnectWebSocket, subscribeToEvent } from "@/lib/websocket";

describe("Frontend WebSocket Integration", () => {
  let mockWebSocket: Partial<WebSocket> & { onmessage?: (ev: { data: string }) => void };

  beforeEach(() => {
    vi.useFakeTimers();

    mockWebSocket = {
      close: vi.fn(),
      readyState: 0,
      onopen: null,
      onmessage: null as unknown as (ev: { data: string }) => void,
      onclose: null,
      onerror: null,
    };

    global.WebSocket = vi.fn().mockImplementation(() => {
      mockWebSocket.readyState = 1; // Open
      return mockWebSocket;
    }) as unknown as typeof WebSocket;
  });

  afterEach(() => {
    disconnectWebSocket();
    vi.useRealTimers();
  });

  it("subscribes to a websocket event", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToEvent("NEW_MESSAGE", callback);

    // Initializing ws and invoking message handler
    connectWebSocket("user-1");
    expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:3000/ws?userId=user-1");

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({
        data: JSON.stringify({ type: "NEW_MESSAGE", data: { content: "Hello" } }),
      });
    }

    expect(callback).toHaveBeenCalledWith({ content: "Hello" });

    // Test unsubscribe
    unsubscribe();
  });

  it("handles multiple event types", () => {
    const callbackNotif = vi.fn();
    subscribeToEvent("NEW_NOTIFICATION", callbackNotif);

    connectWebSocket("user-1");

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({
        data: JSON.stringify({ type: "NEW_NOTIFICATION", data: { id: "notif-1" } }),
      });
    }

    expect(callbackNotif).toHaveBeenCalledWith({ id: "notif-1" });
  });

  it("disconnects the websocket correctly", () => {
    connectWebSocket("user-1");
    disconnectWebSocket();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
