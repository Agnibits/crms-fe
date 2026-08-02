"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { api, unwrap } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";

const BASE = "/organization/departments";

/**
 * Real department options for form selectors, sourced from Settings →
 * Departments (not a hardcoded list). Shares the settings-departments cache.
 */
export function useDepartmentOptions() {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.settings, "departments"],
    queryFn: ({ signal }) => settingsService.list("departments", { signal }),
    staleTime: 60_000,
  });
  const options = (query.data ?? []).map((d) => ({ value: d.id, label: d.name }));
  return { ...query, options, hasDepartments: options.length > 0 };
}

/** One department's record, from the shared settings list (no extra request). */
export function useDepartment(id) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.settings, "departments"],
    queryFn: ({ signal }) => settingsService.list("departments", { signal }),
    staleTime: 60_000,
  });
  return { ...query, data: (query.data ?? []).find((d) => d.id === id) };
}

/** Active users assigned to this department. */
export function useDepartmentMembers(id) {
  return useQuery({
    queryKey: ["departments", id, "members"],
    queryFn: async ({ signal }) => unwrap(await api.get(`${BASE}/${id}/members`, { signal })) ?? [],
    enabled: !!id,
  });
}

/** Unresolved tickets routed here — the queue this team has to work through. */
export function useDepartmentTickets(id) {
  return useQuery({
    queryKey: ["departments", id, "tickets"],
    queryFn: async ({ signal }) => unwrap(await api.get(`${BASE}/${id}/tickets`, { signal })) ?? [],
    enabled: !!id,
  });
}
