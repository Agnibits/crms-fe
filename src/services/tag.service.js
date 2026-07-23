"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";
import { normalizeList } from "./normalize";

/**
 * Tags — flexible labels assigned to leads, customers and deals.
 * Backend: GET/POST /tags, POST /tags/:id/assign|unassign {entityType, entityId},
 * GET /tags/entity/:entityType/:entityId.
 */
export const tagService = {
  /** All tags for the company (the pool to pick from). */
  async list({ signal } = {}) {
    const res = await api.get(ENDPOINTS.tags, { params: { limit: 200 }, signal });
    return normalizeList(res).items ?? [];
  },

  create: ({ name, color }) =>
    api.post(ENDPOINTS.tags, { name, ...(color ? { color } : {}) }).then(unwrap),

  assign: (tagId, entityType, entityId) =>
    api.post(`${ENDPOINTS.tags}/${tagId}/assign`, { entityType, entityId }).then(unwrap),

  unassign: (tagId, entityType, entityId) =>
    api.post(`${ENDPOINTS.tags}/${tagId}/unassign`, { entityType, entityId }).then(unwrap),

  /** Tags currently on a given entity. */
  async forEntity(entityType, entityId, { signal } = {}) {
    const res = await api.get(`${ENDPOINTS.tags}/entity/${entityType}/${entityId}`, { signal });
    const data = unwrap(res);
    return Array.isArray(data) ? data : data?.items ?? [];
  },
};
