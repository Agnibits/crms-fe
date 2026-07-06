"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

export const dashboardService = {
  getStats: async ({ signal } = {}) => unwrap(await api.get(ENDPOINTS.dashboard.stats, { signal })),
  getSalesChart: async (params = {}, { signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.salesChart, { params, signal })),
  getFunnel: async ({ signal } = {}) => unwrap(await api.get(ENDPOINTS.dashboard.funnel, { signal })),
  getPipeline: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.pipeline, { signal })),
  getRecentActivities: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.activities, { signal })),
  getUpcomingTasks: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.tasks, { signal })),
};
