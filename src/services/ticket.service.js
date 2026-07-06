"use client";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

const crud = createCrudService(ENDPOINTS.tickets);

export const ticketService = {
  ...crud,
  /** Post a reply on the ticket thread: POST /tickets/:id/messages */
  reply: (id, payload) => crud.action(id, "messages", payload),
};
