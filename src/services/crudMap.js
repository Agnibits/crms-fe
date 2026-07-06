"use client";

/**
 * Field/enum translation between the mock-era frontend shapes and the backend
 * API contract. Build a mapper with `makeMapper` and wrap a crud service with
 * `withMapping` so list/detail come back in the frontend shape and create/update
 * payloads go out in the backend shape.
 *
 *   const mapper = makeMapper({
 *     rename: { ownerId: "assignedUserId", score: "probability" }, // fe → be
 *     enums:  ["status", "rating"],   // upper-cased on write, lower-cased on read
 *     drop:   ["city"],               // fields with no backend column
 *   });
 *   export const leadService = withMapping(base, mapper);
 */

// Frontend option value → backend enum value, where a plain upper-case is wrong.
const ENUM_OVERRIDES = {
  bank_transfer: "BANK",
  cheque: "BANK",
  other: "CASH",
  declined: "REJECTED",
  void: "CANCELLED",
  social: "SOCIAL_MEDIA",
  closed_won: "WON",
  closed_lost: "LOST",
  shipped: "PROCESSING",
  delivered: "COMPLETED",
};

// Backend enum value → frontend option value, for the handful that don't simply
// lower-case back to a known option.
const ENUM_OVERRIDES_REVERSE = {
  SOCIAL_MEDIA: "social",
  REJECTED: "declined",
};

function toEnumBackend(val) {
  if (typeof val !== "string" || !val) return val;
  return ENUM_OVERRIDES[val] || val.toUpperCase();
}

function toEnumFrontend(val) {
  if (typeof val !== "string" || !val) return val;
  return ENUM_OVERRIDES_REVERSE[val] || val.toLowerCase();
}

export function makeMapper({ rename = {}, enums = [], drop = [], allow = null } = {}) {
  const reverse = Object.fromEntries(Object.entries(rename).map(([fe, be]) => [be, fe]));
  const enumSet = new Set(enums);
  // `allow` is the set of backend-valid field names (post-rename). When present,
  // any field not in it is dropped so Prisma never sees an unknown column.
  const allowSet = allow ? new Set(allow) : null;

  function toBackend(v = {}) {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (drop.includes(k)) continue;
      if (val === undefined || val === null || val === "") continue;
      const key = rename[k] || k;
      if (allowSet && !allowSet.has(key)) continue;
      out[key] = enumSet.has(k) ? toEnumBackend(val) : val;
    }
    return out;
  }

  function fromBackend(c) {
    if (!c || typeof c !== "object") return c;
    const out = { ...c };
    // backend field → frontend alias
    for (const [be, fe] of Object.entries(reverse)) {
      if (c[be] !== undefined) out[fe] = c[be];
    }
    // enum casing back to frontend option values
    for (const feKey of enums) {
      const beKey = rename[feKey] || feKey;
      const val = c[beKey] ?? c[feKey];
      if (typeof val === "string") out[feKey] = toEnumFrontend(val);
    }
    return out;
  }

  return { toBackend, fromBackend };
}

/** Wrap a crud service so reads come back mapped and writes go out mapped. */
export function withMapping(base, mapper = {}) {
  const toBackend = mapper.toBackend || ((x) => x);
  const fromBackend = mapper.fromBackend || ((x) => x);
  return {
    ...base,
    async list(params, opts) {
      const res = await base.list(params, opts);
      return { ...res, items: (res.items || []).map(fromBackend) };
    },
    async getById(id, opts) {
      return fromBackend(await base.getById(id, opts));
    },
    create: (payload) => base.create(toBackend(payload)),
    update: (id, payload) => base.update(id, toBackend(payload)),
    // Inline status/priority patches must be enum-cased too.
    patch: (id, payload) => base.patch(id, toBackend(payload)),
  };
}

/** Split a single "Full Name" field into backend firstName / lastName. */
export function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || firstName;
  return { firstName, lastName };
}
