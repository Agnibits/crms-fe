"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Lead CRUD service + lead-specific actions.
 *   leadService.action(id, "convert")            → convert lead to customer
 *   leadService.action(id, "merge", { mergeId }) → merge a duplicate lead
 * Field map: ownerId→assignedUserId, score→probability, stage→status.
 * The UI's "stage" is the backend LeadStatus enum — the legacy free-text
 * `stage` column is no longer written.
 */
const base = createCrudService(ENDPOINTS.leads);
const mapper = makeMapper({
  rename: { ownerId: "assignedUserId", score: "probability", stage: "status" },
  enums: ["status", "rating", "stage"],
  allow: [
    "name", "title", "company", "email", "phone", "source", "campaign",
    "industry", "value", "rating", "status", "probability",
    "assignedUserId", "notes", "city",
  ],
});

export const leadService = withMapping(base, mapper);
