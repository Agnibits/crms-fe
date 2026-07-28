"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { api, unwrap } from "./api";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Campaign CRUD + marketing actions. Maps the frontend shape to the backend:
 * body↔content, sent/opened/clicked↔sentCount/openCount/clickCount, and type &
 * status enum casing. `audience` is passed through as an object ({ type }).
 */
const base = createCrudService(ENDPOINTS.campaigns);
const mapper = makeMapper({
  rename: {
    body: "content",
    sent: "sentCount",
    opened: "openCount",
    clicked: "clickCount",
  },
  enums: ["type", "status"],
  allow: ["name", "type", "status", "subject", "content", "scheduledAt", "audience"],
});
const mapped = withMapping(base, mapper);

export const campaignService = {
  ...mapped,
  /** How many recipients an audience descriptor ({ type, status? }) resolves to. */
  previewAudience: async (audience) =>
    unwrap(await api.post(`${ENDPOINTS.campaigns}/audience/preview`, audience || {})),
  /** Send the campaign now (delivery runs server-side in the background). */
  send: async (id) => unwrap(await api.post(`${ENDPOINTS.campaigns}/${id}/send`)),
  /** Per-recipient send + open/click status rows. */
  recipients: async (id) => unwrap(await api.get(`${ENDPOINTS.campaigns}/${id}/recipients`)),
};
