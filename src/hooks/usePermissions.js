"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { SUPER_ADMIN_ROLE } from "@/constants/roles";

/**
 * Permission check against the grant the API actually enforces (sent with the
 * profile). Use it to hide actions the caller can't perform — offering a button
 * that only ever returns 403 is the same lie as reporting a save that was
 * discarded.
 *
 *   const can = useCan();
 *   {can("product:delete") && <DeleteButton />}
 *
 * Unknown grants resolve to `true` on purpose: a stale session should degrade
 * to "show it and let the API decide", never to hiding work someone can do.
 */
export function useCan() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const role = useAuthStore((s) => s.user?.rawRole);

  return useCallback(
    (permission) => {
      if (role === "ADMIN" || role === SUPER_ADMIN_ROLE) return true;
      if (!permission || !Array.isArray(permissions)) return true;
      return permissions.includes(permission);
    },
    [permissions, role]
  );
}
