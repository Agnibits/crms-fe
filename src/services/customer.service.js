"use client";

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
  // Backend Customer columns (customer.validator create) — drops annualRevenue/employees etc.
  allow: [
    "name", "company", "email", "phone", "mobile", "website", "industry",
    "addressLine", "country", "state", "city", "postalCode", "taxId",
    "notes", "status", "source", "ownerId",
  ],
});

export const customerService = {
  ...withMapping(base, mapper),
  addNote: (id, body) => base.action(id, "notes", { body }),
};
