"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

const BASE = ENDPOINTS.emailChannels;

/** Helper: unwrap a list that may come back as an array or a paginated object. */
function toArray(res) {
  const body = res?.data;
  const inner = body?.data !== undefined ? body.data : body;
  return Array.isArray(inner) ? inner : inner?.items ?? [];
}

/**
 * Per-company email channels (SMTP for sending, IMAP for receiving replies).
 * Passwords are write-only — the API never returns them.
 */
export const emailChannelService = {
  async list({ signal } = {}) {
    return toArray(await api.get(BASE, { signal }));
  },
  getById: async (id, { signal } = {}) => unwrap(await api.get(`${BASE}/${id}`, { signal })),
  create: async (payload) => unwrap(await api.post(BASE, payload)),
  update: async (id, payload) => unwrap(await api.put(`${BASE}/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`${BASE}/${id}`)),
  /** Verify the SMTP connection for a saved channel. */
  test: async (id) => unwrap(await api.post(`${BASE}/${id}/test`)),
};
