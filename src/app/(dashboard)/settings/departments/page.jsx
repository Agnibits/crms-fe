"use client";

import SectionCrudTable from "@/features/settings/SectionCrudTable";
import { departmentSchema } from "@/validations/settings.schema";

export default function DepartmentsSettingsPage() {
  return (
    <SectionCrudTable
      sectionKey="departments"
      itemLabel="Department"
      title="Departments"
      description="Organise your teams into departments."
      schema={departmentSchema}
      columns={[
        { key: "name", header: "Name", className: "font-medium" },
        { key: "head", header: "Head" },
        { key: "members", header: "Members", className: "text-right tabular-nums" },
      ]}
      fields={[
        { name: "name", label: "Department name", required: true, placeholder: "e.g. Sales" },
        { name: "head", label: "Department head", placeholder: "e.g. Jane Doe" },
        { name: "members", label: "Members", type: "number", placeholder: "0" },
      ]}
    />
  );
}
