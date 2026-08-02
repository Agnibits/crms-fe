"use client";

import { createCrudService, buildListParams } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { API_URL } from "@/constants/app";
import { tokenStorage } from "@/utils/storage";
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

export const auditService = {
  ...withMapping(base, { fromBackend }),
  /**
   * Download the CSV the server builds for the current filters — the whole
   * filtered set, not the page on screen, since a partial export is useless to
   * an auditor. Uses fetch (not the axios instance) so the response stays a
   * blob rather than being parsed as JSON.
   */
  async exportCsv(params = {}) {
    const query = new URLSearchParams(buildListParams(params)).toString();
    const res = await fetch(`${API_URL}${ENDPOINTS.auditLogs}/export?${query}`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken() || ""}` },
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
