"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { userLookupService } from "@/services/user-lookup.service";
import { QUERY_KEYS } from "@/constants/app";

/**
 * Shared lookup hook: users → [{ value, label }] options for owner /
 * "assign to" dropdowns, plus an id → user map for display.
 * Reused by leads, opportunities and deals.
 */
export function useUsersOptions() {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.users, "lookup"],
    queryFn: ({ signal }) => userLookupService.list({}, { signal }),
    staleTime: 5 * 60 * 1000,
  });

  const users = useMemo(() => query.data?.items ?? [], [query.data]);

  const options = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name })),
    [users]
  );

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );

  return { options, usersById, users, isPending: query.isPending };
}
