"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { withMapping } from "./crudMap";

/**
 * Audit log (read-only). Flattens the actor's name and lifts the field-level
 * before/after diff out of `metadata` so the table can render it directly.
 */
const base = createCrudService(ENDPOINTS.auditLogs);

function fromBackend(log) {
  if (!log || typeof log !== "object") return log;
  const user = log.user;
  return {
    ...log,
    userName: user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
      : "System",
    userEmail: user?.email ?? "",
    // { field: { from, to } } — recorded on updates that actually changed something.
    changes: log.metadata?.changes ?? null,
    // Something identifiable about the record, when the entry carries one
    // (role for a permission edit, filename for a file, keys for settings).
    target:
      log.metadata?.role ||
      log.metadata?.name ||
      (Array.isArray(log.metadata?.keys) ? log.metadata.keys.join(", ") : null),
  };
}

export const auditService = withMapping(base, { fromBackend });
