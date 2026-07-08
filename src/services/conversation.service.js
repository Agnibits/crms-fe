"use client";

import { api, unwrap } from "./api";
import { normalizeList } from "./normalize";
import { buildListParams } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

const BASE = ENDPOINTS.conversations;

function toArray(res) {
  const body = res?.data;
  const inner = body?.data !== undefined ? body.data : body;
  return Array.isArray(inner) ? inner : inner?.items ?? [];
}

/**
 * Two-way email inbox. Conversations thread inbound + outbound messages;
 * the backend sends via the company's SMTP and polls IMAP for replies.
 */
export const conversationService = {
  list: async (params = {}, { signal } = {}) =>
    normalizeList(await api.get(BASE, { params: buildListParams(params), signal })),

  getById: async (id, { signal } = {}) => unwrap(await api.get(`${BASE}/${id}`, { signal })),

  messages: async (id, { signal } = {}) => toArray(await api.get(`${BASE}/${id}/messages`, { signal })),

  /** Start a new conversation / send a fresh email. */
  send: async (payload) => unwrap(await api.post(`${BASE}/send`, payload)),

  /** Reply within a thread. */
  reply: async (id, payload) => unwrap(await api.post(`${BASE}/${id}/reply`, payload)),

  markRead: async (id) => unwrap(await api.patch(`${BASE}/${id}/read`)),
  assign: async (id, assignedUserId) => unwrap(await api.patch(`${BASE}/${id}/assign`, { assignedUserId })),
  close: async (id) => unwrap(await api.patch(`${BASE}/${id}/close`)),
  reopen: async (id) => unwrap(await api.patch(`${BASE}/${id}/reopen`)),
};
