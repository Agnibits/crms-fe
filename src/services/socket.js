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
 * Connect the realtime notification channel.
 * `onNotification(payload)` fires for every incoming notification.
 * Returns a disconnect function.
 */
export function connectSocket(onNotification) {
  if (USE_MOCK) {
    // Demo mode: emit a sample notification periodically.
    let i = 0;
    mockTimer = setInterval(() => {
      const event = MOCK_EVENTS[i % MOCK_EVENTS.length];
      i += 1;
      onNotification({
        id: `mock-${Date.now()}`,
        ...event,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }, 90_000);
    return () => clearInterval(mockTimer);
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token: tokenStorage.getAccessToken() },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("notification", onNotification);

  return () => {
    socket?.off("notification", onNotification);
    socket?.disconnect();
    socket = null;
  };
}

export function getSocket() {
  return socket;
}
