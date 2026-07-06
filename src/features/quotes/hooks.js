"use client";
import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { quoteService } from "@/services/quote.service";
import { createCrudService } from "@/services/crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUERY_KEYS } from "@/constants/app";

export const quoteHooks = createCrudHooks({
  key: QUERY_KEYS.quotes,
  service: quoteService,
  label: "Quote",
});

const customerCrud = createCrudService(ENDPOINTS.customers);

/** Lightweight customer list for the quote builder's customer select. */
export function useCustomerOptions(limit = 100) {
  return useQuery({
    queryKey: [...QUERY_KEYS.customers, "list", { page: 1, limit, sortBy: "name", sortOrder: "asc" }],
    queryFn: ({ signal }) =>
      customerCrud.list({ page: 1, limit, sortBy: "name", sortOrder: "asc" }, { signal }),
  });
}
