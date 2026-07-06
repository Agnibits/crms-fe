"use client";

import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import { Lock } from "lucide-react";
import SettingsNav from "@/features/settings/SettingsNav";

export default function SettingsLayout({ children }) {
  return (
    <RoleGate
      roles={["admin", "manager"]}
      fallback={
        <EmptyState
          icon={Lock}
          title="Access denied"
          description="Only administrators and managers can manage company settings."
        />
      }
    >
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your company profile, structure and preferences." />
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <SettingsNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </RoleGate>
  );
}
