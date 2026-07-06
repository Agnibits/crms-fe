"use client";

import { useAuthStore } from "@/store/auth.store";

/**
 * Renders children only when the user has one of `roles` (or `permission`).
 *   <RoleGate roles={["admin", "manager"]}>…</RoleGate>
 *   <RoleGate permission={PERMISSIONS.USER_MANAGE} fallback={<NoAccess />}>…</RoleGate>
 */
export default function RoleGate({ roles, permission, fallback = null, children }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const allowed =
    (roles ? hasRole(roles) : true) && (permission ? hasPermission(permission) : true);

  return allowed ? children : fallback;
}
