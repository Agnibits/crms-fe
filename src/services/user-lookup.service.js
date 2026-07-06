"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Thin read-only lookup over the users collection, used to populate
 * "assign to" / owner dropdowns across modules.
 */
export const userLookupService = {
  async list(params = {}, { signal } = {}) {
    const res = await api.get(ENDPOINTS.users, {
      params: { page: 1, limit: 100, ...params },
      signal,
    });
    return unwrap(res);
  },
};
