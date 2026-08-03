"use client";

import { createCrudService } from "./crud.factory";
import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

const BASE = ENDPOINTS.emailTemplates;

/** Email templates CRUD — fields: name, subject, body, isActive. */
export const emailTemplateService = {
  ...createCrudService(BASE),

  /** Placeholders an author may insert, for the editor's variable list. */
  variables: async ({ signal } = {}) => unwrap(await api.get(`${BASE}/variables`, { signal })) ?? [],

  /**
   * A template with its placeholders filled in, ready to send. Resolved on the
   * server because the values come from records the composer never loads — a
   * ticket reply knows its ticket id, not the customer's email or the branch.
   */
  render: async (id, { ticketId, customerId } = {}, { signal } = {}) =>
    unwrap(await api.post(`${BASE}/${id}/render`, { ticketId, customerId }, { signal })),
};
