"use client";

import { useRouter } from "next/navigation";
import { Network } from "lucide-react";
import SectionCrudTable from "@/features/settings/SectionCrudTable";
import { departmentSchema } from "@/validations/settings.schema";
import { useBranchOptions } from "@/features/branches/hooks";
import { useUsersOptions } from "@/features/leads/useUsersOptions";

export default function DepartmentsSettingsPage() {
  const router = useRouter();
  // The "none" option is selectable so a team can be un-linked from an office.
  // Worded about the team, not its reach — "company-wide" read as though members
  // could see everything, which is decided by their branch and role instead.
  const { options: branchOptions } = useBranchOptions({
    noneLabel: "One team for the whole company",
  });
  const { options: rawUserOptions } = useUsersOptions();
  const userOptions = [{ value: "__none__", label: "No head" }, ...rawUserOptions];

  return (
    <SectionCrudTable
      sectionKey="departments"
      itemLabel="Department"
      title="Departments"
      description="Organise your teams into departments. Tickets can be routed to a department."
      icon={Network}
      onRowClick={(d) => router.push(`/settings/departments/${d.id}`)}
      schema={departmentSchema}
      columns={[
        {
          key: "name",
          header: "Name",
          className: "w-[28%] font-medium",
          render: (d) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{d.name}</p>
              {d.description && (
                <p className="truncate text-xs text-muted-foreground">{d.description}</p>
              )}
            </div>
          ),
        },
        {
          key: "code",
          header: "Code",
          className: "w-[12%] text-muted-foreground",
          render: (d) => d.code || "—",
        },
        {
          key: "branch",
          header: "Exists at",
          className: "w-[24%]",
          render: (d) => d.branch?.name || "Whole company",
        },
        {
          key: "head",
          header: "Head",
          className: "w-[24%]",
          render: (d) =>
            d.head ? `${d.head.firstName ?? ""} ${d.head.lastName ?? ""}`.trim() : "—",
        },
        {
          key: "members",
          header: "Members",
          className: "w-[12%] tabular-nums",
          render: (d) => d._count?.users ?? 0,
        },
      ]}
      fields={[
        { name: "name", label: "Department name", required: true, placeholder: "e.g. Sales" },
        { name: "code", label: "Code", half: true, placeholder: "e.g. SAL" },
        {
          // Department (what the team does) and branch (where a person sits) are
          // separate dimensions — Zoho and Odoo don't nest them either. Only set
          // this when a team genuinely exists at one office.
          name: "branchId",
          label: "Exists at",
          type: "select",
          options: branchOptions,
          placeholder: "One team for the whole company",
          hint: "Pick an office only if you run a separate team per office (a Pune Sales and a Mumbai Sales). This is about the team, not its people — members can sit at any branch either way.",
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
