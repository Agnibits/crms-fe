"use client";

import { api, unwrap } from "./api";
import { normalizeList } from "./normalize";
import { ENDPOINTS } from "@/constants/endpoints";

const COMPANIES = ENDPOINTS.superadmin.companies;

/**
 * SUPER_ADMIN-only tenant management. Backend derives everything from the
 * token — no companyId is ever sent. Suspend/activate toggles login access for
 * every user in the company.
 */
export const superadminService = {
  async listCompanies(params = {}, { signal } = {}) {
    return normalizeList(await api.get(COMPANIES, { params, signal }));
  },

  async createCompany(payload = {}) {
    // Drop empty optionals so backend validators don't reject "" as a bad email/currency.
    const body = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== "" && v != null) body[k] = v;
    }
    return unwrap(await api.post(COMPANIES, body));
  },

  suspendCompany: async (id) => unwrap(await api.patch(`${COMPANIES}/${id}/suspend`)),
  activateCompany: async (id) => unwrap(await api.patch(`${COMPANIES}/${id}/activate`)),
};
