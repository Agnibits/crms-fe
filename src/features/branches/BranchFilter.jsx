"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranchOptions } from "@/features/branches/hooks";

/**
 * "All branches / <branch>" filter for a list page. Renders nothing until the
 * company actually has branches, so single-office tenants never see a control
 * that can only ever have one answer.
 *
 *   <BranchFilter value={t.filters.branchId} onChange={(v) => t.setFilter("branchId", v)} />
 */
export default function BranchFilter({ value, onChange }) {
  const { branches, hasBranches } = useBranchOptions({ includeNone: false });
  if (!hasBranches) return null;

  return (
    <Select value={value ?? "all"} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter by branch">
        <SelectValue placeholder="All branches" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All branches</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.value} value={b.value}>
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
