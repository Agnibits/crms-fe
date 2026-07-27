"use client";

import { io } from "socket.io-client";
import { SOCKET_URL, USE_MOCK } from "@/constants/app";
import { tokenStorage } from "@/utils/storage";
import { api } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

let socket = null;
let mockTimer = null;
let refreshing = false;

/** Refresh the access token (mirrors the axios interceptor) so a reconnect can
 *  use a fresh one — the socket handshake is rejected on an expired token. */
async function refreshAccessToken() {
  if (refreshing) return;
  refreshing = true;
  try {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return;
    const { data } = await api.post(ENDPOINTS.auth.refresh, { refreshToken });
    const payload = data?.data || data;
    tokenStorage.setTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken || refreshToken,
    });
  } catch {
    /* a hard refresh failure is handled by the axios interceptor / forceLogout */
  } finally {
    refreshing = false;
  }
}

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
    // Function form: the CURRENT token is read on every (re)connect attempt, so
    // a freshly refreshed token is picked up automatically.
    auth: (cb) => cb({ token: tokenStorage.getAccessToken() }),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  entries.forEach(([event, fn]) => socket.on(event, fn));

  // Handshake rejected because the access token expired → refresh it; socket.io
  // then reconnects and re-reads the new token.
  socket.on("connect_error", (err) => {
    if (/auth token|token|jwt|expired|unauthor/i.test(String(err?.message || ""))) {
      refreshAccessToken();
    }
  });

  return () => {
    entries.forEach(([event, fn]) => socket?.off(event, fn));
    socket?.disconnect();
    socket = null;
  };
}

export function getSocket() {
  return socket;
}
