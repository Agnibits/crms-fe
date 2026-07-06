"use client";

import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";

/**
 * Fetch an aggregated report payload.
 *   const { data, isPending, error, refetch } = useReport("revenue");
 */
export function useReport(type, options = {}) {
  return useQuery({
    queryKey: ["reports", type],
    queryFn: ({ signal }) => reportService.get(type, { signal }),
    enabled: !!type,
    ...options,
  });
}
