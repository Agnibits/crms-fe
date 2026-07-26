"use client";
import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { ticketService } from "@/services/ticket.service";
import { userService } from "@/services/user.service";
import { QUERY_KEYS } from "@/constants/app";

export const ticketHooks = createCrudHooks({
  key: QUERY_KEYS.tickets,
  service: ticketService,
  label: "Ticket",
});

/** Lightweight users lookup used to resolve ticket assignees. Uses the mapped
 *  userService so each agent carries a normalized `name`/`avatar`. */
export function useAgents() {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, "list", { limit: 100 }],
    queryFn: ({ signal }) => userService.list({ limit: 100 }, { signal }),
    staleTime: 5 * 60_000,
  });
}
