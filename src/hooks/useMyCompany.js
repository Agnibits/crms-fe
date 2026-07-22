"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

/**
 * The signed-in user's (tenant) company profile — used as the letterhead on
 * documents. Tenant scoping means the list only ever contains our company.
 */
export function useMyCompany() {
  const query = useQuery({
    queryKey: ["organization", "my-company"],
    queryFn: async ({ signal }) => {
      const res = await api.get("/organization/companies", { params: { limit: 1 }, signal });
      const body = res?.data;
      const inner = body?.data !== undefined ? body.data : body;
      const list = Array.isArray(inner) ? inner : inner?.items ?? [];
      return list[0] ?? null;
    },
    staleTime: 10 * 60 * 1000,
    retry: false, // a 403 just means no letterhead — fall back quietly
  });
  return { company: query.data ?? null, ...query };
}
