"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Deal CRUD service. Backend deals carry name/stage/owner + line-item money;
 * the mock form's amount/probability/closeDate/customerName have no columns.
 */
const base = createCrudService(ENDPOINTS.deals);
const mapper = makeMapper({
  rename: { ownerId: "assignedUserId" },
  // Backend Deal columns; amount/probability/expectedCloseDate/customerName have none.
  allow: ["name", "stage", "customerId", "assignedUserId", "discount", "tax", "currency"],
});

export const dealService = withMapping(base, mapper);
