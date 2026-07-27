"use client";

import { io } from "socket.io-client";
import { SOCKET_URL, USE_MOCK } from "@/constants/app";
import { tokenStorage } from "@/utils/storage";

let socket = null;
let mockTimer = null;

const MOCK_EVENTS = [
  { type: "lead", title: "New lead assigned", message: "Aarav Shah was assigned to you." },
  { type: "deal", title: "Deal stage changed", message: "Acme Corp deal moved to Negotiation." },
  { type: "invoice", title: "Payment received", message: "Invoice INV-1042 was paid in full." },
  { type: "task", title: "Task due soon", message: "\"Follow up with Globex\" is due in 1 hour." },
];

/**
 * Connect the realtime channel and bind a map of `{ eventName: handler }`.
 * Event names must match what the backend emits (e.g. "notification:new",
 * "conversation:message"). Returns a disconnect function.
 */
export function connectSocket(handlers = {}) {
  const entries = Object.entries(handlers);

  if (USE_MOCK) {
    let i = 0;
    mockTimer = setInterval(() => {
      const event = MOCK_EVENTS[i % MOCK_EVENTS.length];
      i += 1;
      handlers["notification:new"]?.({
        id: `mock-${Date.now()}`,
        ...event,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }, 90_000);
    return () => clearInterval(mockTimer);
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token: tokenStorage.getAccessToken() },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  entries.forEach(([event, fn]) => socket.on(event, fn));

  return () => {
    entries.forEach(([event, fn]) => socket?.off(event, fn));
    socket?.disconnect();
    socket = null;
  };
}

export function getSocket() {
  return socket;
}
