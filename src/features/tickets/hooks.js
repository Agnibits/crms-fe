"use client";
import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { createCrudService } from "@/services/crud.factory";
import { ticketService } from "@/services/ticket.service";
import { QUERY_KEYS } from "@/constants/app";
import { ENDPOINTS } from "@/constants/endpoints";

export const ticketHooks = createCrudHooks({
  key: QUERY_KEYS.tickets,
  service: ticketService,
  label: "Ticket",
});

const userService = createCrudService(ENDPOINTS.users);

/** Lightweight users lookup used to resolve ticket assignees. */
export function useAgents() {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, "list", { limit: 100 }],
    queryFn: ({ signal }) => userService.list({ limit: 100 }, { signal }),
    staleTime: 5 * 60_000,
  });
}
