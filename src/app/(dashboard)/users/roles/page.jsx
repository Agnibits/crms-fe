"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ALL_ROLES, ROLE_LABELS, PERMISSIONS, ROLE_PERMISSIONS } from "@/constants/roles";
import { titleCase } from "@/utils/format";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** Turn "customer:manage" → "Customer · Manage". */
function permissionLabel(permission) {
  const [entity, action] = permission.split(":");
  return `${titleCase(entity)} · ${titleCase(action)}`;
}

function RoleCard({ role }) {
  const [granted, setGranted] = useState(() => new Set(ROLE_PERMISSIONS[role] || []));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (permission) => {
    setGranted((prev) => {
      const next = new Set(prev);
      next.has(permission) ? next.delete(permission) : next.add(permission);
      return next;
    });
    setDirty(true);
  };

  const isAdmin = role === "admin";

  const save = () => {
    // Client-side only in demo mode; a real API would persist the matrix.
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setDirty(false);
      toast.success(`Permissions updated for ${ROLE_LABELS[role]}`);
    }, 500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {ROLE_LABELS[role]}
          </CardTitle>
          <CardDescription className="mt-1">
            {isAdmin ? "Full access to every module." : `${granted.size} of ${ALL_PERMISSIONS.length} permissions granted`}
          </CardDescription>
        </div>
        {!isAdmin && (
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" /> Save
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_PERMISSIONS.map((permission) => (
            <label
              key={permission}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <Checkbox
                checked={isAdmin || granted.has(permission)}
                disabled={isAdmin}
                onCheckedChange={() => toggle(permission)}
              />
              <span className={isAdmin ? "text-muted-foreground" : ""}>{permissionLabel(permission)}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RolesPage() {
  return (
    <RoleGate
      roles={["admin"]}
      fallback={
        <EmptyState
          icon={ShieldCheck}
          title="Access denied"
          description="Only administrators can manage roles and permissions."
        />
      }
    >
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
        </Button>

        <PageHeader
          title="Roles & Permissions"
          description="Control what each role can see and do across the platform."
          actions={<Badge variant="secondary">{ALL_ROLES.length} roles</Badge>}
        />

        <div className="space-y-4">
          {ALL_ROLES.map((role) => (
            <RoleCard key={role} role={role} />
          ))}
        </div>
      </div>
    </RoleGate>
  );
}
