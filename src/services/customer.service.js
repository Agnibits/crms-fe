"use client";

import { api, unwrap } from "./api";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Customer CRUD service. `contactName`→`company`, `address`→`addressLine`,
 * and the status enum is upper-cased on write / lower-cased on read.
 */
const base = createCrudService(ENDPOINTS.customers);
const mapper = makeMapper({
  rename: { contactName: "company", address: "addressLine" },
  enums: ["status"],
  // Backend Customer columns (customer.validator). revenue is auto-calculated
  // (read-only), so it's not sent; annualRevenue has no column.
  allow: [
    "name", "company", "email", "phone", "mobile", "website", "industry",
    "addressLine", "country", "state", "city", "postalCode", "taxId",
    "notes", "status", "source", "ownerId", "employees",
  ],
});

export const customerService = {
  ...withMapping(base, mapper),
  addNote: (id, body) => base.action(id, "notes", { body }),

  /** Distinct industries from this company's actual customers (sorted, deduped). */
  getIndustries: async ({ signal } = {}) =>
    unwrap(await api.get(`${ENDPOINTS.customers}/industries`, { signal })) || [],
};
