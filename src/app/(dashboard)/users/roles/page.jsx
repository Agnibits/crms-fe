"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Save, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleMatrix, useUpdateRolePermissions } from "@/features/roles/hooks";

/** Catalog (ordered) → [{ group, items:[{key,label}] }] preserving first-seen order. */
function groupPermissions(catalog) {
  const order = [];
  const map = new Map();
  for (const p of catalog) {
    if (!map.has(p.group)) {
      map.set(p.group, []);
      order.push(p.group);
    }
    map.get(p.group).push(p);
  }
  return order.map((group) => ({ group, items: map.get(group) }));
}

function RoleCard({ role, catalog, groups, onSave, saving }) {
  const [granted, setGranted] = useState(() => new Set(role.permissions));
  const [dirty, setDirty] = useState(false);

  const toggle = (key) => {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  };

  const reset = () => {
    setGranted(new Set(role.permissions));
    setDirty(false);
  };

  const save = () => {
    onSave(role, [...granted], () => setDirty(false));
  };

  const count = role.editable ? granted.size : catalog.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {role.label}
            {role.isCustomized && !dirty && (
              <Badge variant="secondary" className="text-[10px] font-medium uppercase">
                Customized
              </Badge>
            )}
            {dirty && (
              <Badge variant="outline" className="text-[10px] font-medium uppercase text-amber-600">
                Unsaved
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">
            {role.editable
              ? `${count} of ${catalog.length} permissions granted`
              : "Full access to every module."}
          </CardDescription>
        </div>
        {role.editable && (
          <div className="flex items-center gap-2">
            {dirty && (
              <Button size="sm" variant="ghost" onClick={reset} disabled={saving}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            )}
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((perm) => (
                <label
                  key={perm.key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    checked={role.editable ? granted.has(perm.key) : true}
                    disabled={!role.editable || saving}
                    onCheckedChange={() => toggle(perm.key)}
                  />
                  <span className={role.editable ? "" : "text-muted-foreground"}>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function RolesPage() {
  const { data, isPending, error, refetch } = useRoleMatrix();
  const update = useUpdateRolePermissions();

  const catalog = data?.permissions ?? [];
  const roles = data?.roles ?? [];
  const groups = useMemo(() => groupPermissions(catalog), [catalog]);
  const savingRole = update.isPending ? update.variables?.role : null;

  const handleSave = (role, permissions, onDone) => {
    update.mutate(
      { role: role.role, permissions, label: role.label },
      { onSuccess: onDone }
    );
  };

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
          description="Control what each role can see and do. Changes apply across the platform and are enforced by the API."
          actions={roles.length ? <Badge variant="secondary">{roles.length} roles</Badge> : null}
        />

        {error ? (
          <ErrorState onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <RoleCard
                key={role.role}
                role={role}
                catalog={catalog}
                groups={groups}
                onSave={handleSave}
                saving={savingRole === role.role}
              />
            ))}
          </div>
        )}
      </div>
    </RoleGate>
  );
}
