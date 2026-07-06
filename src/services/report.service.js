"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Report service — fetches aggregated report payloads.
 *   reportService.get("revenue") → GET /reports/revenue
 * Types: revenue | customers | leads | sales | products | employees
 */
export const reportService = {
  async get(type, { signal } = {}) {
    const res = await api.get(`${ENDPOINTS.reports}/${type}`, { signal });
    return unwrap(res);
  },
};
