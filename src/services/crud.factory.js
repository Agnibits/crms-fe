"use client";

import { api, unwrap } from "./api";
import { normalizeList } from "./normalize";

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
      // Backend caps `limit` at 100; several pages request more for client-side
      // filtering — clamp so those requests don't 422.
      const safeParams =
        params.limit != null ? { ...params, limit: Math.min(Number(params.limit) || 20, 100) } : params;
      const res = await api.get(basePath, { params: safeParams, signal });
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
