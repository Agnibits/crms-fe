"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

export const notificationService = {
  list: async (params = {}, { signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.notifications, { params, signal })),
  markAsRead: async (id) => unwrap(await api.patch(`${ENDPOINTS.notifications}/${id}/read`)),
  markAllAsRead: async () => unwrap(await api.patch(`${ENDPOINTS.notifications}/read-all`)),
  remove: async (id) => unwrap(await api.delete(`${ENDPOINTS.notifications}/${id}`)),
};
