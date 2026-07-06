"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { customerHooks } from "@/features/customers/hooks";
import ImportCustomersDialog from "@/features/customers/ImportCustomersDialog";
import { CUSTOMER_STATUSES } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Manufacturing",
  "Healthcare",
  "Finance",
  "Retail",
  "Education",
  "Real Estate",
  "Logistics",
  "Media",
  "Energy",
];

const EXPORT_COLUMNS = [
  { key: "name", label: "Company" },
  { key: "contactName", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "status", label: "Status" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "annualRevenue", label: "Annual Revenue" },
  { key: "employees", label: "Employees" },
  { key: "createdAt", label: "Created At" },
];

export default function CustomersPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = customerHooks.useList(t.queryParams);
  const remove = customerHooks.useRemove();
  const bulkRemove = customerHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            {row.original.contactName && (
              <p className="truncate text-xs text-muted-foreground">{row.original.contactName}</p>
            )}
          </div>
        ),
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "industry", header: "Industry" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge value={row.original.status} options={CUSTOMER_STATUSES} />
        ),
      },
      {
        accessorKey: "annualRevenue",
        header: "Revenue",
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrency(row.original.annualRevenue)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/customers/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/customers/${row.original.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer accounts and their activity."
        actions={
          <Button onClick={() => router.push("/customers/new")}>
            <Plus /> Add Customer
          </Button>
        }
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
        enableRowSelection
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
        searchPlaceholder="Search customers…"
        emptyTitle="No customers found"
        emptyDescription="Try adjusting your search or filters, or add your first customer."
        toolbar={
          <>
            <Select
              value={t.filters.status ?? "all"}
              onValueChange={(v) => t.setFilter("status", v)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CUSTOMER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={t.filters.industry ?? "all"}
              onValueChange={(v) => t.setFilter("industry", v)}
            >
              <SelectTrigger className="w-[160px]" aria-label="Filter by industry">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {INDUSTRY_OPTIONS.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(data?.items ?? [], "customers.csv", EXPORT_COLUMNS)
              }
              disabled={!data?.items?.length}
            >
              <Download /> Export
            </Button>
          </>
        }
        bulkActions={(rows, clear) => (
          <Button
            variant="destructive"
            size="sm"
            loading={bulkRemove.isPending}
            onClick={() =>
              bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })
            }
          >
            <Trash2 /> Delete selected
          </Button>
        )}
      />

      <ImportCustomersDialog open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete customer?"
        description="This will permanently remove the customer and cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
