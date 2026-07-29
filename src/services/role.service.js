"use client";

import { api, unwrap } from "./api";
import { ENDPOINTS } from "@/constants/endpoints";

/**
 * Editable, per-company RBAC. The matrix (permission catalog + each role's
 * effective grant) is fully backend-driven so the UI can never drift from what
 * the API actually enforces.
 */
export const roleService = {
  getMatrix: async () => unwrap(await api.get(ENDPOINTS.rolesMatrix)),

  updateRolePermissions: async (role, { permissions, dataScope }) =>
    unwrap(await api.put(`${ENDPOINTS.roles}/${role}/permissions`, { permissions, dataScope })),
};
