"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createCrudService } from "@/services/crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUERY_KEYS } from "@/constants/app";

const userService = createCrudService(ENDPOINTS.users);

/**
 * Users as select options + a quick lookup map.
 *   const { options, usersById, isPending } = useUsersOptions();
 */
export function useUsersOptions() {
  const { data, isPending } = useQuery({
    queryKey: [...QUERY_KEYS.users, "list", { limit: 100 }],
    queryFn: ({ signal }) => userService.list({ limit: 100 }, { signal }),
    staleTime: 5 * 60 * 1000,
  });

  const users = data?.items ?? [];

  const options = useMemo(
    () => users.map((user) => ({ value: user.id, label: user.name })),
    [users]
  );

  const usersById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user])),
    [users]
  );

  return { users, options, usersById, isPending };
}
