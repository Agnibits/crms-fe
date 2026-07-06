"use client";

import { api, unwrap } from "./api";
import { normalizeList } from "./normalize";

/**
 * Calendar events.
 *
 * The backend has no /events resource, so the calendar is backed by Activities
 * (which carry a scheduledAt time, a type and a subject). This gives the
 * calendar real data and avoids a 404. Create/update/patch map back to
 * /activities. (The calendar page additionally overlays Tasks by dueDate.)
 */
const ACTIVITY_TO_EVENT_TYPE = {
  CALL: "call", MEETING: "meeting", EMAIL: "email", NOTE: "note", WHATSAPP: "whatsapp", SMS: "sms",
};
const EVENT_TO_ACTIVITY_TYPE = {
  call: "CALL", meeting: "MEETING", email: "EMAIL", note: "NOTE", whatsapp: "WHATSAPP", sms: "SMS",
};

function toEvent(a) {
  if (!a || typeof a !== "object") return a;
  return {
    ...a,
    id: a.id,
    title: a.subject ?? a.title,
    start: a.scheduledAt ?? a.start,
    end: a.completedAt ?? a.scheduledAt ?? a.end,
    allDay: false,
    type: ACTIVITY_TO_EVENT_TYPE[a.type] || "meeting",
  };
}

function toActivity(v = {}) {
  const out = {
    type: EVENT_TO_ACTIVITY_TYPE[String(v.type || "").toLowerCase()] || "MEETING",
    subject: v.title,
    scheduledAt: v.start || undefined,
    completedAt: v.end || undefined,
    description: v.description || undefined,
    location: v.location || undefined,
  };
  Object.keys(out).forEach((k) => (out[k] === undefined || out[k] === "") && delete out[k]);
  return out;
}

export const eventService = {
  async list(params = {}, { signal } = {}) {
    const limit = Math.min(Number(params.limit) || 100, 100);
    const res = normalizeList(await api.get("/activities", { params: { ...params, limit }, signal }));
    return { ...res, items: (res.items || []).filter((a) => a.scheduledAt).map(toEvent) };
  },
  async getById(id, { signal } = {}) {
    return toEvent(unwrap(await api.get(`/activities/${id}`, { signal })));
  },
  create: async (payload) => toEvent(unwrap(await api.post("/activities", toActivity(payload)))),
  update: async (id, payload) => toEvent(unwrap(await api.put(`/activities/${id}`, toActivity(payload)))),
  patch: async (id, payload) => toEvent(unwrap(await api.put(`/activities/${id}`, toActivity(payload)))),
  remove: async (id) => unwrap(await api.delete(`/activities/${id}`)),
};
