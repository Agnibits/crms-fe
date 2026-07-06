"use client";

import { api, unwrap } from "./api";

/**
 * Settings service.
 *
 * The backend splits "settings" into two stores:
 *  - App preferences: a flat key/value map at /settings/map (dotted keys like
 *    "company.currency"), written back via /settings/bulk. Scalar sections
 *    (company prefs, tax, currency, appearance) read/write here.
 *  - Organization entities: /organization/{branches,departments,teams}. Array
 *    sections read from here.
 *
 * get()/update() are best-effort and never throw a 404 — sections the backend
 * doesn't model simply resolve to an empty object.
 */
const ORG_SECTIONS = {
  branches: "/organization/branches",
  departments: "/organization/departments",
  teams: "/organization/teams",
};

// /organization/* create requires a companyId (UUID). Resolve the org's company once.
let _companyId;
async function companyId() {
  if (_companyId !== undefined) return _companyId;
  try {
    const res = await api.get("/organization/companies", { params: { limit: 1 } });
    const body = res?.data;
    const inner = body?.data !== undefined ? body.data : body;
    const list = Array.isArray(inner) ? inner : inner?.items ?? [];
    _companyId = list[0]?.id ?? null;
  } catch {
    _companyId = null;
  }
  return _companyId;
}

// Map the mock form fields to real Prisma columns (extra fields would 400 Prisma).
function toOrgPayload(key, v = {}) {
  if (key === "branches") {
    return { name: v.name, city: v.city || undefined, country: v.country || undefined, isHeadOffice: !!v.isPrimary };
  }
  if (key === "departments") {
    return { name: v.name, branchId: v.branchId || undefined };
  }
  if (key === "teams") {
    return { name: v.name, departmentId: v.departmentId || undefined };
  }
  return v;
}

/** Flat dotted map { "company.currency": "USD" } → nested section object. */
function sectionFromMap(map, key) {
  const out = {};
  const prefix = `${key}.`;
  for (const [k, v] of Object.entries(map || {})) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}

async function fetchMap(signal) {
  try {
    return unwrap(await api.get("/settings/map", { signal })) || {};
  } catch {
    return {};
  }
}

function listFrom(res) {
  const body = res?.data;
  const inner = body?.data !== undefined ? body.data : body;
  if (Array.isArray(inner)) return inner;
  return inner?.items ?? [];
}

export const settingsService = {
  /* ── Scalar sections: read from /settings/map, write to /settings/bulk ── */

  async get(key, { signal } = {}) {
    const map = await fetchMap(signal);
    return sectionFromMap(map, key);
  },

  async update(key, payload) {
    const settings = {};
    for (const [k, v] of Object.entries(payload || {})) settings[`${key}.${k}`] = v;
    return unwrap(await api.put("/settings/bulk", { settings }));
  },

  /* ── Array sections: branches / departments / teams → /organization/* ── */

  async list(key, { signal } = {}) {
    const url = ORG_SECTIONS[key] || `/settings/${key}`;
    try {
      const items = listFrom(await api.get(url, { signal }));
      if (key === "branches") {
        return items.map((b) => ({ ...b, isPrimary: b.isHeadOffice ?? b.isPrimary }));
      }
      return items;
    } catch {
      return [];
    }
  },

  async create(key, payload) {
    const url = ORG_SECTIONS[key] || `/settings/${key}`;
    if (ORG_SECTIONS[key]) {
      const body = { ...toOrgPayload(key, payload), companyId: await companyId() };
      return unwrap(await api.post(url, body));
    }
    return unwrap(await api.post(url, payload));
  },

  async updateItem(key, id, payload) {
    const url = ORG_SECTIONS[key] || `/settings/${key}`;
    const body = ORG_SECTIONS[key] ? toOrgPayload(key, payload) : payload;
    return unwrap(await api.put(`${url}/${id}`, body));
  },

  async removeItem(key, id) {
    const url = ORG_SECTIONS[key] || `/settings/${key}`;
    return unwrap(await api.delete(`${url}/${id}`));
  },
};
