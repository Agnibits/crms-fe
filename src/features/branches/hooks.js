"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { QUERY_KEYS } from "@/constants/app";

const NONE_VALUE = "__none__";

/**
 * Branch options for form selectors (assign a user / lead / deal / quote to a
 * branch). Shares the settings-branches query cache so edits reflect everywhere.
 * The list is prefixed with a "No branch" sentinel so a selection can be cleared.
 */
export function useBranchOptions({ includeNone = true, noneLabel = "No branch" } = {}) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.settings, "branches"],
    queryFn: ({ signal }) => settingsService.list("branches", { signal }),
    staleTime: 60_000,
  });
  const branches = (query.data ?? []).map((b) => ({ value: b.id, label: b.name }));
  const options = includeNone ? [{ value: NONE_VALUE, label: noneLabel }, ...branches] : branches;
  return { ...query, options, branches, hasBranches: branches.length > 0 };
}

/** Normalize a selected branch value ("" / sentinel) to a real id or null. */
export function toBranchId(value) {
  return value && value !== NONE_VALUE ? value : null;
}

export { NONE_VALUE as NO_BRANCH };
