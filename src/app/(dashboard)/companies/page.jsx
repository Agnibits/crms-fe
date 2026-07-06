"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/common/StatCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { useAuthStore } from "@/store/auth.store";
import { useCompanies, useSetCompanyActive } from "@/features/companies/hooks";
import CompanyFormDialog from "@/features/companies/CompanyFormDialog";
import { formatNumber, formatDate } from "@/utils/format";

export default function CompaniesPage() {
  const isSuperAdmin = useAuthStore((s) => s.user?.rawRole === "SUPER_ADMIN");
  const t = useTableState();
  const { data, isPending, error, refetch } = useCompanies(t.queryParams);
  const all = useCompanies({ page: 1, limit: 100 });
  const setActive = useSetCompanyActive();

  const [formOpen, setFormOpen] = useState(false);
  const [suspendId, setSuspendId] = useState(null);

  const allCompanies = all.data?.items ?? [];
  const stats = {
    total: all.data?.total ?? 0,
    users: allCompanies.reduce((sum, c) => sum + (c._count?.users ?? 0), 0),
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "—" },
      { accessorKey: "country", header: "Country", cell: ({ row }) => row.original.country || "—" },
      { accessorKey: "currency", header: "Currency", cell: ({ row }) => row.original.currency || "—" },
      {
        id: "users",
        header: "Users",
        cell: ({ row }) => formatNumber(row.original._count?.users ?? 0),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (row.original.createdAt ? formatDate(row.original.createdAt) : "—"),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 48,
        cell: ({ row }) => {
          const company = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${company.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setActive.mutate({ id: company.id, active: true })}
                >
                  <UserCheck /> Activate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setSuspendId(company.id)}
                >
                  <UserX /> Suspend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [setActive]
  );

  if (!isSuperAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access denied"
        description="Only the platform super admin can manage companies."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Onboard and manage tenant companies across the platform."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> Add Company
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Companies" value={formatNumber(stats.total)} icon={Building2} loading={all.isPending} index={0} />
        <StatCard title="Total Users" value={formatNumber(stats.users)} icon={Users} loading={all.isPending} index={1} />
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
        searchPlaceholder="Search companies…"
        emptyTitle="No companies yet"
      />

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!suspendId}
        onOpenChange={(open) => !open && setSuspendId(null)}
        destructive
        title="Suspend company?"
        description="Every user in this company will be blocked from signing in until you activate it again."
        confirmLabel="Suspend"
        loading={setActive.isPending}
        onConfirm={() =>
          setActive.mutate({ id: suspendId, active: false }, { onSuccess: () => setSuspendId(null) })
        }
      />
    </div>
  );
}
