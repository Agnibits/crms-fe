"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { QUERY_KEYS } from "@/constants/app";

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
