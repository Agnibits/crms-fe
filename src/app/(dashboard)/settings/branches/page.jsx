"use client";

import { Building2 } from "lucide-react";
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
      icon={Building2}
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
        { name: "code", label: "Branch code", half: true, placeholder: "e.g. PUN-01" },
        { name: "phone", label: "Phone", half: true, placeholder: "e.g. +91 98765 43210" },
        { name: "email", label: "Email", half: true, placeholder: "branch@company.com" },
        { name: "addressLine", label: "Address", placeholder: "Street address" },
        { name: "city", label: "City", required: true, half: true },
        { name: "state", label: "State / Region", half: true },
        { name: "postalCode", label: "Postal code", half: true },
        { name: "country", label: "Country", required: true, half: true },
        { name: "isPrimary", label: "Primary branch", type: "switch", hint: "Mark as the main office" },
      ]}
    />
  );
}
