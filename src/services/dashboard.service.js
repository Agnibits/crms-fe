"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";
import { titleCase } from "@/utils/format";

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
  // FunnelBarChart reads `count`, so emit that key (not `value`).
  getFunnel: async ({ signal } = {}) => {
    const summary = unwrap(await api.get(ENDPOINTS.dashboard.summary, { signal }));
    const byStatus = summary?.leadsByStatus || [];
    return byStatus.map((r) => ({
      stage: titleCase(r.status ?? r.stage ?? r.name ?? ""),
      count: Number(r.count ?? r.value ?? 0),
    }));
  },

  // pipeline-view returns [{ stage: { name }, count, totalValue }] — flatten it.
  // A company can have several pipelines that reuse the same stage names, which
  // arrive as separate rows; merge them by stage so each appears once.
  getPipeline: async ({ signal } = {}) => {
    const data = unwrap(await api.get(ENDPOINTS.dashboard.pipeline, { signal }));
    const merged = new Map();
    for (const p of Array.isArray(data) ? data : []) {
      const stage = titleCase(p.stage?.name ?? p.stage ?? "");
      if (!stage) continue;
      const row = merged.get(stage) || { stage, count: 0, value: 0 };
      row.count += Number(p.count ?? 0);
      row.value += Number(p.totalValue ?? p.value ?? 0);
      merged.set(stage, row);
    }
    return [...merged.values()];
  },

  getRecentActivities: async ({ signal } = {}) =>
    unwrap(await api.get(ENDPOINTS.dashboard.activities, { signal })),

  getUpcomingTasks: async ({ signal } = {}) => {
    const data = unwrap(await api.get(ENDPOINTS.dashboard.tasks, { signal }));
    return Array.isArray(data) ? data : data?.items ?? [];
  },
};
