"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Building2, CalendarDays, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import { DEAL_STAGES } from "@/constants/options";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { dealHooks } from "./hooks";

function DealCard({ deal }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
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
      onClick={() => router.push(`/deals/${deal.id}`)}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{deal.name}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
        <Building2 className="h-3 w-3 shrink-0" /> {deal.customerName}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(deal.amount)}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{deal.probability}%</span>
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3" /> {formatDate(deal.expectedCloseDate)}
      </p>
    </div>
  );
}

function StageColumn({ stage, deals }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });
  const total = deals.reduce((acc, d) => acc + (d.amount || 0), 0);

  return (
    <div className="flex w-72 min-w-72 shrink-0 flex-col rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusBadge value={stage.value} options={DEAL_STAGES} />
          <span className="text-xs font-medium text-muted-foreground">{deals.length}</span>
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
        {deals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-xs text-muted-foreground">Drop deals here</p>
          </div>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

/** Drag-and-drop deal pipeline board grouped by DEAL_STAGES. */
export default function DealBoard() {
  const { data, isPending, error, refetch } = dealHooks.useList({ limit: 100 });
  const patch = dealHooks.usePatch();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const items = data?.items ?? [];
  const grouped = useMemo(() => {
    const map = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, []]));
    items.forEach((deal) => {
      (map[deal.stage] ?? (map[deal.stage] = [])).push(deal);
    });
    return map;
  }, [items]);

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const deal = items.find((d) => d.id === active.id);
    if (deal && deal.stage !== over.id) {
      patch.mutate({ id: active.id, stage: over.id });
    }
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <div key={stage.value} className="w-72 min-w-72 shrink-0 space-y-2 rounded-xl border bg-muted/40 p-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <StageColumn key={stage.value} stage={stage} deals={grouped[stage.value] ?? []} />
        ))}
      </div>
    </DndContext>
  );
}
