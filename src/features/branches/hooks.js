"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
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

/**
 * The signed-in user's own branch, for pre-selecting it on NEW records.
 *
 * Without a default nobody picks one, everything lands in "Unassigned", and the
 * per-branch reports stay empty — which defeats the point of tagging at all.
 * It's only a default: the field stays editable, and users with no branch
 * (typically HQ) get nothing pre-selected.
 */
export function useMyBranchId() {
  return useAuthStore((s) => s.user?.branchId) ?? "";
}

/** Branch to pre-fill a form with: the record's own, else the user's on create. */
export function useDefaultBranchId(defaultValues) {
  const mine = useMyBranchId();
  const isEdit = !!defaultValues?.id;
  return defaultValues?.branchId ?? (isEdit ? "" : mine);
}

/** Normalize a selected branch value ("" / sentinel) to a real id or null. */
export function toBranchId(value) {
  return value && value !== NONE_VALUE ? value : null;
}

export { NONE_VALUE as NO_BRANCH };
