"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Dashboard service. The backend exposes /dashboard/overview,
 * /dashboard/monthly-revenue, /dashboard/recent-activities and
 * /dashboard/summary (which bundles everything), plus the pipeline view under
 * /opportunities. Each method reshapes the response into what the widgets expect.
 */
export const dashboardService = {
  getStats: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.stats, { signal })),

  getSalesChart: async (params = {}, { signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.salesChart, { params, signal })),

  // No dedicated funnel endpoint — derive it from the summary's leadsByStatus.
  getFunnel: async ({ signal } = {}) => {
    const summary = unwrap(await api.get(ENDPOINTS.dashboard.summary, { signal }));
    const byStatus = summary?.leadsByStatus || [];
    return byStatus.map((r) => ({
      stage: r.status ?? r.stage ?? r.name,
      value: r.count ?? r.value ?? 0,
    }));
  },

  // pipeline-view returns [{ stage: { name }, count, totalValue }] — flatten it.
  getPipeline: async ({ signal } = {}) => {
    const data = unwrap(await api.get(ENDPOINTS.dashboard.pipeline, { signal }));
    return (Array.isArray(data) ? data : []).map((p) => ({
      stage: p.stage?.name ?? p.stage,
      count: p.count ?? 0,
      value: p.totalValue ?? p.value ?? 0,
    }));
  },

  getRecentActivities: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.activities, { signal })),

  getUpcomingTasks: async ({ signal } = {}) => {
    const data = unwrap(await api.get(ENDPOINTS.dashboard.tasks, { signal }));
    return Array.isArray(data) ? data : data?.items ?? [];
  },
};
