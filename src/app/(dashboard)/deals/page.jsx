"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Building2,
  CalendarDays,
  Download,
  Eye,
  GripVertical,
  Kanban,
  List,
  MoreHorizontal,
  Pencil,
  Percent,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import OwnerCell from "@/components/common/OwnerCell";
import StatCard from "@/components/common/StatCard";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { opportunityHooks } from "@/features/opportunities/hooks";
import { opportunityService } from "@/services/opportunity.service";
import { useStageOptions } from "@/features/opportunities/useStageOptions";
import { toastError } from "@/services/api";
import { QUERY_KEYS } from "@/constants/app";
import { exportToCsv } from "@/utils/export";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/utils/format";
import { cn } from "@/utils/cn";


/* ── Pipeline board (drag & drop) ─────────────────────────────── */

function OpportunityCard({ opportunity }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: "relative",
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/deals/${opportunity.id}`)}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{opportunity.name}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
        <Building2 className="h-3 w-3 shrink-0" /> {opportunity.customerName}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(opportunity.amount)}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {opportunity.probability}%
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3" /> {formatDate(opportunity.expectedCloseDate)}
      </p>
    </div>
  );
}

function PipelineColumn({ stage, opportunities }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opportunities.reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <div className="flex w-72 min-w-72 shrink-0 flex-col rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusBadge value={stage.value} options={[stage]} />
          <span className="text-xs font-medium text-muted-foreground">
            {opportunities.length}
          </span>
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {formatCompactCurrency(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[160px] flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30 rounded-b-xl"
        )}
      >
        {opportunities.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-xs text-muted-foreground">Drop deals here</p>
          </div>
        ) : (
          opportunities.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)
        )}
      </div>
    </div>
  );
}

function PipelineBoard({ items, stages, isPending, error, refetch }) {
  const queryClient = useQueryClient();
  const move = useMutation({
    // Move-stage keeps probability and WON/LOST status in sync server-side.
    mutationFn: ({ id, stageId }) => opportunityService.moveStage(id, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities }),
    onError: (e) => toastError(e, "Failed to move deal"),
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = useMemo(() => {
    const map = Object.fromEntries(stages.map((s) => [s.value, []]));
    items.forEach((opp) => {
      map[opp.stage]?.push(opp);
    });
    return map;
  }, [items, stages]);

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const opp = items.find((o) => o.id === active.id);
    if (opp && opp.stageId !== over.id) {
      move.mutate({ id: active.id, stageId: over.id });
    }
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (isPending || !stages.length) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 min-w-72 shrink-0 space-y-2 rounded-xl border bg-muted/40 p-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            opportunities={grouped[stage.value] ?? []}
          />
        ))}
      </div>
    </DndContext>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function OpportunitiesPage() {
  const router = useRouter();
  const t = useTableState();
  const list = opportunityHooks.useList(t.queryParams);
  // Full-ish snapshot for the forecast row + pipeline board.
  const all = opportunityHooks.useList({ limit: 200 });
  const remove = opportunityHooks.useRemove();
  const bulkRemove = opportunityHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);

  const allItems = all.data?.items ?? [];

  // The company's actual pipeline drives columns, badges and the stage filter.
  const { stageOptions } = useStageOptions();

  const forecast = useMemo(() => {
    // Status is authoritative (OPEN/WON/LOST) — stage names are per-company.
    const open = allItems.filter((o) => o.status === "OPEN");
    const totalPipeline = open.reduce((acc, o) => acc + Number(o.amount || 0), 0);
    const weighted = open.reduce(
      (acc, o) => acc + ((o.amount || 0) * (o.probability || 0)) / 100,
      0
    );

    // Win rate this quarter, from deals closed (won or lost) this quarter.
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const closedThisQuarter = allItems.filter((o) => {
      if (o.status !== "WON" && o.status !== "LOST") return false;
      const date = new Date(o.expectedCloseDate || o.updatedAt);
      return date >= quarterStart && date <= now;
    });
    const won = closedThisQuarter.filter((o) => o.status === "WON").length;
    const winRate =
      closedThisQuarter.length > 0 ? (won / closedThisQuarter.length) * 100 : 0;

    return { totalPipeline, weighted, openCount: open.length, winRate };
  }, [allItems]);

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
        cell: ({ row }) => <StatusBadge value={row.original.stage} options={stageOptions} />,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">{formatCurrency(row.original.amount)}</span>
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
        cell: ({ row }) => <OwnerCell entity={row.original} />,
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
              <DropdownMenuItem
                onClick={() => router.push(`/deals/${row.original.id}`)}
              >
                <Eye /> View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/deals/${row.original.id}/edit`)}
              >
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
    [router, stageOptions]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Track potential revenue and forecast your pipeline."
        actions={
          <Button onClick={() => router.push("/deals/new")}>
            <Plus /> Add Deal
          </Button>
        }
      />

      {/* Forecast summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pipeline Value"
          value={formatCurrency(forecast.totalPipeline)}
          icon={Target}
          hint="Open deals"
          loading={all.isPending}
          index={0}
        />
        <StatCard
          title="Weighted Forecast"
          value={formatCurrency(forecast.weighted)}
          icon={TrendingUp}
          hint="Σ amount × probability"
          loading={all.isPending}
          index={1}
        />
        <StatCard
          title="Open Deals"
          value={formatNumber(forecast.openCount)}
          icon={Percent}
          hint="Not yet closed"
          loading={all.isPending}
          index={2}
        />
        <StatCard
          title="Win Rate (Quarter)"
          value={formatPercent(forecast.winRate)}
          icon={Trophy}
          hint="Closed-won share this quarter"
          loading={all.isPending}
          index={3}
        />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <Kanban className="h-4 w-4" /> Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DataTable
            columns={columns}
            data={list.data?.items ?? []}
            loading={list.isPending}
            error={list.error}
            onRetry={list.refetch}
            pageCount={list.data?.totalPages ?? 1}
            total={list.data?.total ?? 0}
            {...t.tableProps}
            enableRowSelection
            onRowClick={(row) => router.push(`/deals/${row.id}`)}
            searchPlaceholder="Search deals…"
            emptyTitle="No deals found"
            emptyDescription="Try adjusting your search or filters, or add a new deal."
            toolbar={
              <Select
                value={t.filters.stageId ?? "all"}
                onValueChange={(v) => t.setFilter("stageId", v)}
              >
                <SelectTrigger className="w-40" aria-label="Filter by stage">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
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
                  exportToCsv(list.data?.items ?? [], "deals.csv", [
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

        <TabsContent value="pipeline" className="mt-4">
          <PipelineBoard
            items={allItems}
            stages={stageOptions}
            isPending={all.isPending}
            error={all.error}
            refetch={all.refetch}
          />
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
