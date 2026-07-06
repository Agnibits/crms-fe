"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Lead CRUD service + lead-specific actions.
 *   leadService.action(id, "convert")            → convert lead to customer
 *   leadService.action(id, "merge", { mergeId }) → merge a duplicate lead
 * Field map: ownerId→assignedUserId, score→probability; "city" has no column.
 */
const base = createCrudService(ENDPOINTS.leads);
const mapper = makeMapper({
  rename: { ownerId: "assignedUserId", score: "probability" },
  enums: ["status", "rating"],
  allow: [
    "name", "title", "company", "email", "phone", "source", "campaign",
    "industry", "value", "rating", "status", "stage", "probability",
    "assignedUserId", "notes",
  ],
});

export const leadService = withMapping(base, mapper);
