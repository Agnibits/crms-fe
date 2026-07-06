"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Lead CRUD service + lead-specific actions.
 *   leadService.action(id, "convert")          → convert lead to customer
 *   leadService.action(id, "merge", { mergeId }) → merge a duplicate lead
 */
export const leadService = {
  ...createCrudService(ENDPOINTS.leads),
};
