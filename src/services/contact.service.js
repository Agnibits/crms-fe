"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping, splitName } from "./crudMap";

/**
 * Contact CRUD service. The form's single "name" splits into firstName/lastName,
 * "jobTitle" maps to the backend "designation". The list's Customer column reads
 * the resolved `contact.customer` object.
 */
const base = createCrudService(ENDPOINTS.contacts);

/** Coerce any date value to a plain ISO date (YYYY-MM-DD) the backend accepts.
 *  Handles a native date input (already ISO) and a US-formatted string, without
 *  a timezone shift, so a locale/cache quirk can't send "07/26/2026". */
function toIsoDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

const inner = makeMapper({
  rename: { jobTitle: "designation" },
  // Drops the derived "customerName" label (customerId carries the relation).
  allow: [
    "email", "phone", "designation", "department", "birthday", "linkedin",
    "notes", "isPrimary", "customerId", "city",
  ],
});

const mapper = {
  toBackend(v = {}) {
    const { name, ...rest } = v;
    if (rest.birthday !== undefined) rest.birthday = toIsoDate(rest.birthday);
    return { ...(name ? splitName(name) : {}), ...inner.toBackend(rest) };
  },
  fromBackend(c) {
    if (!c || typeof c !== "object") return c;
    const full = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
    return {
      ...inner.fromBackend(c),
      name: c.name || full,
      // Resolved customer object → the fields the list/form expect.
      customerId: c.customerId ?? c.customer?.id,
      customerName: c.customer?.name ?? c.customerName ?? "",
    };
  },
};

export const contactService = withMapping(base, mapper);
