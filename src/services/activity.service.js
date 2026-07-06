"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/** Activity CRUD service. duration→durationMin; type enum cased. */
const base = createCrudService(ENDPOINTS.activities);
const mapper = makeMapper({
  rename: { duration: "durationMin" },
  enums: ["type"],
  // Drops userName / userId / createdAt that the form rides along.
  allow: [
    "type", "subject", "description", "scheduledAt", "completedAt",
    "durationMin", "location", "customerId", "relatedType", "relatedId",
  ],
});

export const activityService = withMapping(base, mapper);
