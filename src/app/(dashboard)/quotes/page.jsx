"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { quoteHooks } from "@/features/quotes/hooks";
import { QUOTE_STATUSES } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";

export default function QuotesPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = quoteHooks.useList(t.queryParams);
  const remove = quoteHooks.useRemove();
  const bulkRemove = quoteHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "number",
        header: "Number",
        cell: ({ row }) => <span className="font-medium">{row.original.number}</span>,
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge value={row.original.status} options={QUOTE_STATUSES} />,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="text-right tabular-nums">{formatCurrency(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "validUntil",
        header: "Valid Until",
        cell: ({ row }) => formatDate(row.original.validUntil),
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
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/quotes/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
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
        title="Quotes"
        description="Create, send and track quotations."
        actions={
          <Button onClick={() => router.push("/quotes/new")}>
            <Plus className="h-4 w-4" /> New Quote
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
        searchPlaceholder="Search quotes…"
        onRowClick={(row) => router.push(`/quotes/${row.id}`)}
        emptyTitle="No quotes found"
        emptyDescription="Create your first quote to get started."
        toolbar={
          <Select
            value={t.filters.status ?? "all"}
            onValueChange={(v) => t.setFilter("status", v)}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportToCsv(data?.items ?? [], "quotes.csv", [
                { key: "number", label: "Number" },
                { key: "customerName", label: "Customer" },
                { key: "status", label: "Status" },
                { key: "subtotal", label: "Subtotal" },
                { key: "discount", label: "Discount" },
                { key: "tax", label: "Tax" },
                { key: "total", label: "Total" },
                { key: "validUntil", label: "Valid Until" },
                { key: "createdAt", label: "Created" },
              ])
            }
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        }
        bulkActions={(rows, clear) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete quote?"
        description="This quote will be permanently removed."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
