"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/** Backend sends `isRead`; the UI reads `read`. Normalize so the read state
 *  actually sticks (otherwise every notification always looks unread). */
export const normalizeNotification = (n) =>
  n && typeof n === "object" ? { ...n, read: n.read ?? n.isRead ?? false } : n;

export const notificationService = {
  list: async (params = {}, { signal } = {}) => {
    const res = unwrap(await api.get(ENDPOINTS.notifications, { params, signal }));
    if (Array.isArray(res)) return res.map(normalizeNotification);
    if (res?.items) return { ...res, items: res.items.map(normalizeNotification) };
    return res;
  },
  markAsRead: async (id) => unwrap(await api.patch(`${ENDPOINTS.notifications}/${id}/read`)),
  markAllAsRead: async () => unwrap(await api.patch(`${ENDPOINTS.notifications}/read-all`)),
  remove: async (id) => unwrap(await api.delete(`${ENDPOINTS.notifications}/${id}`)),
};
