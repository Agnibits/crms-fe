"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { contactService } from "@/services/contact.service";
import { customerService } from "@/services/customer.service";
import { QUERY_KEYS } from "@/constants/app";

export const contactHooks = createCrudHooks({
  key: QUERY_KEYS.contacts,
  service: contactService,
  label: "Contact",
});

/** Customers as `{ value, label }` options for the contact form select. */
export function useCustomerOptions() {
  const params = { limit: 100, sortBy: "name", sortOrder: "asc" };
  const query = useQuery({
    queryKey: [...QUERY_KEYS.customers, "list", params],
    queryFn: ({ signal }) => customerService.list(params, { signal }),
    staleTime: 60 * 1000,
  });

  const options = useMemo(
    () => (query.data?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
    [query.data]
  );

  return { ...query, options };
}
