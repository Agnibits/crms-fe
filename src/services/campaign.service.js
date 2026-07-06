"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Campaign CRUD service. body→content; type (social→SOCIAL_MEDIA) and status
 * enums cased; the form's free-text "audience" (backend expects an object) is dropped.
 */
const base = createCrudService(ENDPOINTS.campaigns);
// `audience` is a free-text segment name; backend wants an object, so it's excluded.
const mapper = makeMapper({
  rename: { body: "content" },
  enums: ["type", "status"],
  allow: ["name", "type", "status", "subject", "content", "scheduledAt"],
});

export const campaignService = withMapping(base, mapper);
