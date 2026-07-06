"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

const path = (key) => ENDPOINTS.settings[key] || `/settings/${key}`;

/**
 * Settings service.
 *
 * Object sections (company, email, sms, tax, currency, preferences):
 *   settingsService.get("company") / settingsService.update("company", payload)
 *
 * Array sections (branches, departments, teams) additionally support
 * item-level CRUD via /settings/<key> and /settings/<key>/<id>:
 *   list / create / updateItem / removeItem
 */
export const settingsService = {
  async get(key, { signal } = {}) {
    const res = await api.get(path(key), { signal });
    return unwrap(res);
  },

  async update(key, payload) {
    const res = await api.put(path(key), payload);
    return unwrap(res);
  },

  /* ── Array sections: branches / departments / teams ─────────── */

  async list(key, { signal } = {}) {
    const res = await api.get(path(key), { signal });
    return unwrap(res);
  },

  async create(key, payload) {
    const res = await api.post(path(key), payload);
    return unwrap(res);
  },

  async updateItem(key, id, payload) {
    const res = await api.put(`${path(key)}/${id}`, payload);
    return unwrap(res);
  },

  async removeItem(key, id) {
    const res = await api.delete(`${path(key)}/${id}`);
    return unwrap(res);
  },
};
