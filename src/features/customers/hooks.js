"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { customerService } from "@/services/customer.service";
import { api, unwrap } from "@/services/api";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUERY_KEYS } from "@/constants/app";

export const customerHooks = createCrudHooks({
  key: QUERY_KEYS.customers,
  service: customerService,
  label: "Customer",
});

/** Distinct industries present on this company's customers (for the filter dropdown). */
export function useCustomerIndustries() {
  return useQuery({
    queryKey: [...QUERY_KEYS.customers, "industries"],
    queryFn: ({ signal }) => customerService.getIndustries({ signal }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Lightweight lookup of users so ownerId can be rendered as a name.
 * Returns the query plus an `ownersById` map.
 */
export function useOwners() {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.users, "list", { limit: 100 }],
    queryFn: async ({ signal }) => {
      const res = await api.get(ENDPOINTS.users, { params: { limit: 100 }, signal });
      return unwrap(res);
    },
    staleTime: 5 * 60 * 1000,
  });

  const ownersById = useMemo(() => {
    const map = {};
    for (const user of query.data?.items ?? []) map[user.id] = user;
    return map;
  }, [query.data]);

  return { ...query, ownersById };
}
