"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/** Support ticket CRUD service. status/priority enums cased. */
const base = createCrudService(ENDPOINTS.tickets);

export const ticketService = {
  ...withMapping(
    base,
    makeMapper({
      enums: ["status", "priority"],
      allow: ["subject", "description", "priority", "status", "customerId", "assignedUserId"],
    })
  ),
  /** Post a reply on the ticket thread: POST /tickets/:id/messages */
  reply: (id, payload) => base.action(id, "messages", payload),
};
