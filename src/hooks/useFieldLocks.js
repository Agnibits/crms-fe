"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

const LOCK_HINT = "Read-only for your role";

/**
 * Which fields the signed-in user may not change, for one module.
 *
 *   const { isLocked, lockProps } = useFieldLocks("product");
 *   <FormNumber {...lockProps("sellingPrice")} … />
 *
 * The API strips locked fields from writes regardless (middlewares/fieldLocks);
 * this just stops the UI from accepting an edit it knows will be discarded and
 * then reporting success.
 */
export function useFieldLocks(moduleKey) {
  const locked = useAuthStore((s) => s.user?.lockedFields);

  const isLocked = useCallback(
    (field) => {
      if (!locked?.length) return false;
      return locked.includes(`${moduleKey}.${field}`);
    },
    [locked, moduleKey]
  );

  /** Spread onto a form field to disable it and explain why. */
  const lockProps = useCallback(
    (field) => (isLocked(field) ? { disabled: true, hint: LOCK_HINT } : {}),
    [isLocked]
  );

  return { isLocked, lockProps, hasLocks: !!locked?.length };
}
