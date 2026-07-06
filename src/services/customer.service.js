"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Customer CRUD service.
 * Extras:
 *   addNote(id, body) → POST /customers/:id/notes
 */
const base = createCrudService(ENDPOINTS.customers);

export const customerService = {
  ...base,
  addNote: (id, body) => base.action(id, "notes", { body }),
};
