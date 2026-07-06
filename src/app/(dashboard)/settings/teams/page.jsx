"use client";

import SectionCrudTable from "@/features/settings/SectionCrudTable";
import { teamSchema } from "@/validations/settings.schema";

export default function TeamsSettingsPage() {
  return (
    <SectionCrudTable
      sectionKey="teams"
      itemLabel="Team"
      title="Teams"
      description="Group members into working teams."
      schema={teamSchema}
      columns={[
        { key: "name", header: "Name", className: "font-medium" },
        { key: "lead", header: "Team lead" },
        { key: "members", header: "Members", className: "text-right tabular-nums" },
      ]}
      fields={[
        { name: "name", label: "Team name", required: true, placeholder: "e.g. Enterprise Sales" },
        { name: "lead", label: "Team lead", placeholder: "e.g. John Smith" },
        { name: "members", label: "Members", type: "number", placeholder: "0" },
      ]}
    />
  );
}
