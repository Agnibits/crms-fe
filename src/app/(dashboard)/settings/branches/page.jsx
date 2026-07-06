"use client";

import { Badge } from "@/components/ui/badge";
import SectionCrudTable from "@/features/settings/SectionCrudTable";
import { branchSchema } from "@/validations/settings.schema";

export default function BranchesSettingsPage() {
  return (
    <SectionCrudTable
      sectionKey="branches"
      itemLabel="Branch"
      title="Branches"
      description="Manage your office locations."
      schema={branchSchema}
      columns={[
        { key: "name", header: "Name", className: "font-medium" },
        { key: "city", header: "City" },
        { key: "country", header: "Country" },
        {
          key: "isPrimary",
          header: "Primary",
          render: (item) =>
            item.isPrimary ? <Badge variant="secondary">Primary</Badge> : <span className="text-muted-foreground">—</span>,
        },
      ]}
      fields={[
        { name: "name", label: "Branch name", required: true, placeholder: "e.g. Pune HQ" },
        { name: "city", label: "City", required: true },
        { name: "country", label: "Country", required: true },
        { name: "isPrimary", label: "Primary branch", type: "switch", hint: "Mark as the main office" },
      ]}
    />
  );
}
