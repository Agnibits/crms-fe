"use client";

import { Network } from "lucide-react";
import SectionCrudTable from "@/features/settings/SectionCrudTable";
import { departmentSchema } from "@/validations/settings.schema";
import { useBranchOptions } from "@/features/branches/hooks";
import { useUsersOptions } from "@/features/leads/useUsersOptions";

export default function DepartmentsSettingsPage() {
  // "Company-wide" (none) is selectable so a department can be un-linked from a branch.
  const { options: branchOptions } = useBranchOptions({ noneLabel: "Company-wide" });
  const { options: rawUserOptions } = useUsersOptions();
  const userOptions = [{ value: "__none__", label: "No head" }, ...rawUserOptions];

  return (
    <SectionCrudTable
      sectionKey="departments"
      itemLabel="Department"
      title="Departments"
      description="Organise your teams into departments. Tickets can be routed to a department."
      icon={Network}
      schema={departmentSchema}
      columns={[
        { key: "name", header: "Name", className: "font-medium" },
        { key: "branch", header: "Branch", render: (d) => d.branch?.name || "—" },
        {
          key: "head",
          header: "Head",
          render: (d) =>
            d.head ? `${d.head.firstName ?? ""} ${d.head.lastName ?? ""}`.trim() : "—",
        },
        {
          key: "members",
          header: "Members",
          className: "text-right tabular-nums",
          render: (d) => d._count?.users ?? 0,
        },
      ]}
      fields={[
        { name: "name", label: "Department name", required: true, placeholder: "e.g. Sales" },
        { name: "code", label: "Code", half: true, placeholder: "e.g. SAL" },
        {
          name: "branchId",
          label: "Branch",
          half: true,
          type: "select",
          options: branchOptions,
          placeholder: "Company-wide",
        },
        {
          name: "headId",
          label: "Department head",
          type: "select",
          options: userOptions,
          placeholder: "Select a head (optional)",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 3,
          placeholder: "What this department handles (optional)",
        },
      ]}
    />
  );
}
