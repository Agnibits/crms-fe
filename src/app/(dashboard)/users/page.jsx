"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import RoleGate from "@/components/common/RoleGate";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import UserAvatar from "@/components/common/UserAvatar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { userHooks } from "@/features/users/hooks";
import UserFormDialog from "@/features/users/UserFormDialog";
import { ROLE_LABELS, ROLES } from "@/constants/roles";
import { formatNumber, formatRelative } from "@/utils/format";

/** Colored role badge options (StatusBadge-compatible). */
const ROLE_BADGES = [
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], color: "violet" },
  { value: ROLES.MANAGER, label: ROLE_LABELS[ROLES.MANAGER], color: "blue" },
  { value: ROLES.SALES, label: ROLE_LABELS[ROLES.SALES], color: "green" },
  { value: ROLES.SUPPORT, label: ROLE_LABELS[ROLES.SUPPORT], color: "amber" },
  { value: ROLES.USER, label: ROLE_LABELS[ROLES.USER], color: "gray" },
];

const USER_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
];

export default function UsersPage() {
  const t = useTableState();
  const { data, isPending, error, refetch } = userHooks.useList(t.queryParams);
  // Wide fetch just for the KPI tiles (mock data is small).
  const all = userHooks.useList({ page: 1, limit: 500 });
  const patch = userHooks.usePatch();
  const remove = userHooks.useRemove();

  const [formDialog, setFormDialog] = useState({ open: false, user: null });
  const [deleteId, setDeleteId] = useState(null);

  const allUsers = all.data?.items ?? [];
  const stats = {
    total: all.data?.total ?? 0,
    active: allUsers.filter((u) => u.status === "active").length,
    admins: allUsers.filter((u) => u.role === ROLES.ADMIN).length,
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={row.original.name} src={row.original.avatar} className="h-8 w-8" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <StatusBadge value={row.original.role} options={ROLE_BADGES} />,
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => row.original.department || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge value={row.original.status} options={USER_STATUSES} />,
      },
      {
        accessorKey: "lastLoginAt",
        header: "Last Login",
        cell: ({ row }) =>
          row.original.lastLoginAt ? formatRelative(row.original.lastLoginAt) : "Never",
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 48,
        cell: ({ row }) => {
          const user = row.original;
          const isActive = user.status === "active";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${user.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setFormDialog({ open: true, user })}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    patch.mutate({ id: user.id, status: isActive ? "inactive" : "active" })
                  }
                >
                  {isActive ? (
                    <>
                      <UserX /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck /> Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(user.id)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [patch]
  );

  return (
    <RoleGate
      roles={["admin"]}
      fallback={
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="Only administrators can manage users."
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage workspace members, their roles and access."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/users/roles">
                  <ShieldCheck /> Roles &amp; Permissions
                </Link>
              </Button>
              <Button onClick={() => setFormDialog({ open: true, user: null })}>
                <Plus /> Add User
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Users"
            value={formatNumber(stats.total)}
            icon={Users}
            hint="All workspace members"
            loading={all.isPending}
            index={0}
          />
          <StatCard
            title="Active"
            value={formatNumber(stats.active)}
            icon={UserCheck}
            hint="Can sign in right now"
            loading={all.isPending}
            index={1}
          />
          <StatCard
            title="Administrators"
            value={formatNumber(stats.admins)}
            icon={ShieldCheck}
            hint="Full access accounts"
            loading={all.isPending}
            index={2}
          />
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isPending}
          error={error}
          onRetry={refetch}
          pageCount={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          {...t.tableProps}
          searchPlaceholder="Search users…"
          emptyTitle="No users found"
          toolbar={
            <Select value={t.filters.role ?? "all"} onValueChange={(v) => t.setFilter("role", v)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLE_BADGES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <UserFormDialog
          open={formDialog.open}
          onOpenChange={(open) => setFormDialog((prev) => ({ open, user: open ? prev.user : null }))}
          user={formDialog.user}
        />

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          destructive
          title="Delete user?"
          description="The user will lose access immediately. This action cannot be undone."
          confirmLabel="Delete"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
        />
      </div>
    </RoleGate>
  );
}
