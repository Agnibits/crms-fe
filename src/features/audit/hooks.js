"use client";

import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";

/** Paginated audit log. Params flow straight through useTableState. */
export function useAuditLogs(params) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: ({ signal }) => auditService.list(params, { signal }),
    placeholderData: (prev) => prev,
  });
}
