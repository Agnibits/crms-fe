"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping, splitName } from "./crudMap";
import { normalizeUser, toBackendRole } from "./normalize";

/**
 * User CRUD service. Reads are normalized like the auth user (name/avatar/role).
 * Writes split "name"→firstName/lastName and map the lowercase role id back to
 * the backend Role enum; the form's free-text "department" has no id to map to.
 */
const base = createCrudService(ENDPOINTS.users);
const inner = makeMapper({
  enums: ["status"],
  // Drops the free-text "department" label + create-only avatar/emailVerified/lastLoginAt.
  allow: ["email", "password", "phone", "status", "companyId", "departmentId", "teamId"],
});

const mapper = {
  toBackend(v = {}) {
    const { name, role, ...rest } = v;
    const out = inner.toBackend(rest);
    if (name) Object.assign(out, splitName(name));
    if (role) out.role = toBackendRole(role);
    return out;
  },
  fromBackend: normalizeUser,
};

export const userService = withMapping(base, mapper);
