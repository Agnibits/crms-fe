"use client";

import { useMemo } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/tables/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableState } from "@/hooks/useTableState";
import { useAuditLogs } from "@/features/audit/hooks";
import { formatDateTime, titleCase } from "@/utils/format";

const ACTIONS = [
  { value: "CREATE", label: "Created", color: "green" },
  { value: "UPDATE", label: "Updated", color: "blue" },
  { value: "DELETE", label: "Deleted", color: "red" },
  { value: "LOGIN", label: "Signed in", color: "gray" },
  { value: "LOGOUT", label: "Signed out", color: "gray" },
  { value: "EXPORT", label: "Exported", color: "amber" },
  { value: "IMPORT", label: "Imported", color: "amber" },
];

/** "sellingPrice" → "Selling price" */
function fieldLabel(field) {
  return titleCase(String(field).replace(/([A-Z])/g, " $1")).replace(/\s+/g, " ").trim();
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

// Only updates carry a field diff — say what happened for the rest instead of
// showing a column full of dashes.
const NO_DIFF_TEXT = {
  CREATE: "Record created",
  DELETE: "Record deleted",
  LOGIN: "Signed in",
  LOGOUT: "Signed out",
  EXPORT: "Data exported",
  IMPORT: "Data imported",
  UPDATE: "No field changes recorded",
};

/** Renders the recorded change for one entry. */
function Changes({ changes, action }) {
  const entries = changes ? Object.entries(changes) : [];
  if (!entries.length) {
    return (
      <span className="text-sm text-muted-foreground">
        {NO_DIFF_TEXT[action] || "—"}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map(([field, change]) => (
        <div key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-medium">{fieldLabel(field)}</span>
          {/* Permission edits record added/removed lists rather than a scalar swap. */}
          {Array.isArray(change?.added) || Array.isArray(change?.removed) ? (
            <>
              {change.added?.length > 0 && (
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                  + {change.added.join(", ")}
                </span>
              )}
              {change.removed?.length > 0 && (
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                  − {change.removed.join(", ")}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground line-through">
                {formatValue(change?.from)}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                {formatValue(change?.to)}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditLogPage() {
  const t = useTableState();
  const { data, isPending, error, refetch } = useAuditLogs(t.queryParams);

  const columns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "userName",
        header: "Who",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.userName}</p>
            {row.original.userEmail && (
              <p className="truncate text-xs text-muted-foreground">{row.original.userEmail}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => <StatusBadge value={row.original.action} options={ACTIONS} />,
      },
      {
        accessorKey: "entity",
        header: "Record",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{fieldLabel(row.original.entity) || "—"}</p>
            {row.original.target && (
              <p className="truncate text-xs text-muted-foreground">{row.original.target}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "changes",
        header: "What changed",
        enableSorting: false,
        cell: ({ row }) => (
          <Changes changes={row.original.changes} action={row.original.action} />
        ),
      },
    ],
    []
  );

  return (
    <RoleGate
      roles={["admin"]}
      fallback={
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="Only administrators can view the audit log."
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Audit Log"
          description="Every change made in the CRM — who did it, when, and what the value was before."
        />

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isPending}
          error={error}
          onRetry={refetch}
          pageCount={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          {...t.tableProps}
          searchPlaceholder="Search by record type…"
          emptyTitle="Nothing recorded yet"
          emptyDescription="Changes will appear here as your team works."
          toolbar={
            <Select
              value={t.filters.action ?? "all"}
              onValueChange={(v) => t.setFilter("action", v)}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>
    </RoleGate>
  );
}
