"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import OwnerCell from "@/components/common/OwnerCell";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
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
import { leadHooks } from "@/features/leads/hooks";
import LeadKanban from "@/features/leads/LeadKanban";
import { LEAD_STAGES, LEAD_SOURCES, LEAD_RATINGS, findOption } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";

export default function LeadsPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = leadHooks.useList(t.queryParams);
  const remove = leadHooks.useRemove();
  const bulkRemove = leadHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: "company", header: "Company" },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => <StatusBadge value={row.original.stage} options={LEAD_STAGES} />,
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) =>
          findOption(LEAD_SOURCES, row.original.source)?.label ?? row.original.source,
      },
      {
        accessorKey: "value",
        header: "Value",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">{formatCurrency(row.original.value)}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => <StatusBadge value={row.original.rating} options={LEAD_RATINGS} />,
      },
      {
        accessorKey: "ownerId",
        header: "Owner",
        cell: ({ row }) => <OwnerCell entity={row.original} />,
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
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/leads/${row.original.id}`)}>
                <Eye /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/leads/${row.original.id}/edit`)}>
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
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Capture, qualify and convert your sales leads."
        actions={
          <Button onClick={() => router.push("/leads/new")}>
            <Plus /> Add Lead
          </Button>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid className="h-4 w-4" /> Kanban
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
            onRowClick={(row) => router.push(`/leads/${row.id}`)}
            searchPlaceholder="Search leads…"
            emptyTitle="No leads found"
            emptyDescription="Try adjusting your search or filters, or add your first lead."
            toolbar={
              <>
                <Select
                  value={t.filters.status ?? "all"}
                  onValueChange={(v) => t.setFilter("status", v)}
                >
                  <SelectTrigger className="w-36" aria-label="Filter by stage">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={t.filters.source ?? "all"}
                  onValueChange={(v) => t.setFilter("source", v)}
                >
                  <SelectTrigger className="w-36" aria-label="Filter by source">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button
                variant="outline"
                onClick={() =>
                  exportToCsv(data?.items ?? [], "leads.csv", [
                    { key: "name", label: "Name" },
                    { key: "company", label: "Company" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "stage", label: "Stage" },
                    { key: "source", label: "Source" },
                    { key: "value", label: "Value" },
                    { key: "rating", label: "Rating" },
                    { key: "city", label: "City" },
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

        <TabsContent value="kanban" className="mt-4">
          <LeadKanban />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete lead?"
        description="This will permanently remove the lead. This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
