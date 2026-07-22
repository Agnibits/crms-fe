"use client";

import { api } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";
import { normalizeList, normalizeUser } from "./normalize";

/**
 * Thin read-only lookup over the users collection, used to populate
 * "assign to" / owner dropdowns across modules. Returns the frontend list
 * shape with normalized users ({ name, avatar, ... }).
 */
export const userLookupService = {
  async list(params = {}, { signal } = {}) {
    const res = await api.get(ENDPOINTS.users, {
      params: { page: 1, limit: 100, ...params },
      signal,
    });
    const list = normalizeList(res);
    return { ...list, items: (list?.items ?? []).map(normalizeUser) };
  },
};
