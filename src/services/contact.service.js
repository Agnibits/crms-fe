"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping, splitName } from "./crudMap";

/**
 * Contact CRUD service. The form's single "name" splits into firstName/lastName,
 * "jobTitle" maps to the backend "designation"; "city" has no backend column.
 */
const base = createCrudService(ENDPOINTS.contacts);
const inner = makeMapper({
  rename: { jobTitle: "designation" },
  // Drops the derived "customerName" label and "city" (no column).
  allow: [
    "email", "phone", "designation", "department", "birthday", "linkedin",
    "notes", "isPrimary", "customerId",
  ],
});

const mapper = {
  toBackend(v = {}) {
    const { name, ...rest } = v;
    return { ...(name ? splitName(name) : {}), ...inner.toBackend(rest) };
  },
  fromBackend(c) {
    if (!c || typeof c !== "object") return c;
    const full = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
    return { ...inner.fromBackend(c), name: c.name || full };
  },
};

export const contactService = withMapping(base, mapper);
