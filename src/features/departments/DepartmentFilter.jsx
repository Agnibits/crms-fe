"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentOptions } from "@/features/departments/hooks";

/**
 * "All departments / <department>" filter. Renders nothing until departments
 * exist, so a company that doesn't use them never sees the control.
 *
 *   <DepartmentFilter value={t.filters.departmentId} onChange={(v) => t.setFilter("departmentId", v)} />
 */
export default function DepartmentFilter({ value, onChange }) {
  const { options, hasDepartments } = useDepartmentOptions();
  if (!hasDepartments) return null;

  return (
    <Select value={value ?? "all"} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter by department">
        <SelectValue placeholder="All departments" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All departments</SelectItem>
        {options.map((d) => (
          <SelectItem key={d.value} value={d.value}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
