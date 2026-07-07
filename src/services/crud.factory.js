"use client";

import { api, unwrap } from "./api";
import { normalizeList } from "./normalize";

// Standard list params passed through as-is; everything else is a filter and
// must go out in the backend's bracket notation: `filter[key]=VALUE`.
const STANDARD_PARAMS = new Set(["page", "limit", "search", "q", "sortBy", "sortOrder"]);
// Filter fields whose values are backend enums → sent UPPERCASE (free-text
// filters like `industry` are left as typed).
const ENUM_FILTER_KEYS = new Set(["status", "priority", "rating", "method", "type", "role"]);

/**
 * Shape the UI's flat query object into what the API expects:
 *  { page, limit, search, sortBy, sortOrder, filter[status]=ACTIVE, filter[industry]=… }
 * Skips empty / "all" (the dropdowns' no-filter sentinel) and clamps limit to 100.
 */
export function buildListParams(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (STANDARD_PARAMS.has(key)) {
      out[key] = key === "limit" ? Math.min(Number(value) || 20, 100) : value;
    } else {
      out[`filter[${key}]`] =
        ENUM_FILTER_KEYS.has(key) && typeof value === "string" ? value.toUpperCase() : value;
    }
  }
  return out;
}

/**
 * Factory producing a standard CRUD service for a REST collection.
 * Every method accepts an optional `{ signal }` for cancellation
 * (React Query passes its AbortSignal automatically).
 *
 * List params: { page, limit, search, sortBy, sortOrder, ...filters }
 */
export function createCrudService(basePath) {
  return {
    basePath,

    async list(params = {}, { signal } = {}) {
      const res = await api.get(basePath, { params: buildListParams(params), signal });
      return normalizeList(res);
    },

    async getById(id, { signal } = {}) {
      const res = await api.get(`${basePath}/${id}`, { signal });
      return unwrap(res);
    },

    async create(payload) {
      const res = await api.post(basePath, payload);
      return unwrap(res);
    },

    async update(id, payload) {
      const res = await api.put(`${basePath}/${id}`, payload);
      return unwrap(res);
    },

    async patch(id, payload) {
      const res = await api.patch(`${basePath}/${id}`, payload);
      return unwrap(res);
    },

    async remove(id) {
      const res = await api.delete(`${basePath}/${id}`);
      return unwrap(res);
    },

    async bulkRemove(ids) {
      const res = await api.post(`${basePath}/bulk-delete`, { ids });
      return unwrap(res);
    },

    /** Fetch a sub-resource, e.g. sub("42", "timeline") → GET /customers/42/timeline */
    async sub(id, path, params = {}, { signal } = {}) {
      const res = await api.get(`${basePath}/${id}/${path}`, { params, signal });
      return unwrap(res);
    },

    /** Post to a sub-resource or action, e.g. action("42", "convert", {...}) */
    async action(id, path, payload = {}) {
      const res = await api.post(`${basePath}/${id}/${path}`, payload);
      return unwrap(res);
    },
  };
}
