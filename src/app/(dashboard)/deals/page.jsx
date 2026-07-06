"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  Kanban,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { dealHooks } from "@/features/deals/hooks";
import DealBoard from "@/features/deals/DealBoard";
import { useUsersOptions } from "@/features/leads/useUsersOptions";
import { DEAL_STAGES } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";

export default function DealsPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = dealHooks.useList(t.queryParams);
  const remove = dealHooks.useRemove();
  const bulkRemove = dealHooks.useBulkRemove();
  const { usersById } = useUsersOptions();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "name",
        header: "Deal",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => <StatusBadge value={row.original.stage} options={DEAL_STAGES} />,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">{formatCurrency(row.original.amount)}</div>
        ),
      },
      {
        accessorKey: "probability",
        header: "Probability",
        cell: ({ row }) => (
          <div className="flex w-24 items-center gap-2">
            <Progress value={row.original.probability} className="h-1.5 flex-1" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.original.probability}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "expectedCloseDate",
        header: "Expected Close",
        cell: ({ row }) => formatDate(row.original.expectedCloseDate),
      },
      {
        accessorKey: "ownerId",
        header: "Owner",
        cell: ({ row }) => usersById[row.original.ownerId]?.name ?? "—",
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
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/deals/${row.original.id}`)}>
                <Eye /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/deals/${row.original.id}/edit`)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, usersById]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your active deals and move them through the pipeline."
        actions={
          <Button onClick={() => router.push("/deals/new")}>
            <Plus /> Add Deal
          </Button>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="board">
            <Kanban className="h-4 w-4" /> Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
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
            onRowClick={(row) => router.push(`/deals/${row.id}`)}
            searchPlaceholder="Search deals…"
            emptyTitle="No deals found"
            emptyDescription="Try adjusting your search or filters, or add your first deal."
            toolbar={
              <Select
                value={t.filters.stage ?? "all"}
                onValueChange={(v) => t.setFilter("stage", v)}
              >
                <SelectTrigger className="w-40" aria-label="Filter by stage">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {DEAL_STAGES.map((s) => (
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
                  exportToCsv(data?.items ?? [], "deals.csv", [
                    { key: "name", label: "Name" },
                    { key: "customerName", label: "Customer" },
                    { key: "stage", label: "Stage" },
                    { key: "amount", label: "Amount" },
                    { key: "probability", label: "Probability" },
                    { key: "expectedCloseDate", label: "Expected Close" },
                    { key: "createdAt", label: "Created At" },
                  ])
                }
              >
                <Download /> Export
              </Button>
            }
            bulkActions={(rows, clear) => (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })
                }
                disabled={bulkRemove.isPending}
              >
                <Trash2 /> Delete
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <DealBoard />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete deal?"
        description="This will permanently remove the deal. This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
