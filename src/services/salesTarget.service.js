"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Monthly sales targets — these feed the dashboard's revenue-vs-target chart.
 *
 * A company has one `defaultTarget` applied to every month, plus optional
 * per-month overrides. Deleting an override falls back to the default.
 *
 *   GET    /sales-targets?year=2026   → { defaultTarget, items: [{ month, amount }] }
 *   PUT    /sales-targets/default     { amount }
 *   PUT    /sales-targets/2026-07     { amount }
 *   DELETE /sales-targets/2026-07     → back to default
 */
export const salesTargetService = {
  async get(year, { signal } = {}) {
    const res = await api.get(ENDPOINTS.salesTargets, { params: { year }, signal });
    const data = unwrap(res) || {};
    return {
      defaultTarget: Number(data.defaultTarget ?? 0),
      items: Array.isArray(data.items) ? data.items : [],
    };
  },

  async setDefault(amount) {
    return unwrap(await api.put(`${ENDPOINTS.salesTargets}/default`, { amount: Number(amount) }));
  },

  /** month: "YYYY-MM" */
  async setMonth(month, amount) {
    return unwrap(await api.put(`${ENDPOINTS.salesTargets}/${month}`, { amount: Number(amount) }));
  },

  /** Removes the override so the month falls back to the default. */
  async resetMonth(month) {
    return unwrap(await api.delete(`${ENDPOINTS.salesTargets}/${month}`));
  },
};
