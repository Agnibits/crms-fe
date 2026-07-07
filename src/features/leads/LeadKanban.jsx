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
import { Building2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import { LEAD_STAGES, LEAD_SOURCES, findOption } from "@/constants/options";
import { formatCompactCurrency, formatCurrency, getInitials } from "@/utils/format";
import { cn } from "@/utils/cn";
import { leadHooks } from "./hooks";
import { useUsersOptions } from "./useUsersOptions";

function LeadCard({ lead, owner }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
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
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{lead.name}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
        <Building2 className="h-3 w-3 shrink-0" /> {lead.company}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(lead.value)}</span>
        <Badge variant="outline" className="text-[10px]">
          {findOption(LEAD_SOURCES, lead.source)?.label ?? lead.source}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Progress value={lead.score} className="h-1.5 flex-1" />
        <span className="text-xs tabular-nums text-muted-foreground">{lead.score}</span>
      </div>
      {owner && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            {getInitials(owner.name)}
          </span>
          <span className="truncate text-xs text-muted-foreground">{owner.name}</span>
        </div>
      )}
    </div>
  );
}

function StageColumn({ stage, leads, usersById }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });
  const total = leads.reduce((acc, l) => acc + (l.value || 0), 0);

  return (
    <div className="flex w-72 min-w-72 shrink-0 flex-col rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusBadge value={stage.value} options={LEAD_STAGES} />
          <span className="text-xs font-medium text-muted-foreground">{leads.length}</span>
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
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-xs text-muted-foreground">Drop leads here</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              owner={
                lead.assignedUser
                  ? { name: `${lead.assignedUser.firstName} ${lead.assignedUser.lastName || ""}`.trim() }
                  : usersById[lead.ownerId]
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

/** Drag-and-drop lead pipeline board grouped by stage. */
export default function LeadKanban() {
  const { data, isPending, error, refetch } = leadHooks.useList({ limit: 100 });
  const patch = leadHooks.usePatch();
  const { usersById } = useUsersOptions();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const items = data?.items ?? [];
  const grouped = useMemo(() => {
    const map = Object.fromEntries(LEAD_STAGES.map((s) => [s.value, []]));
    items.forEach((lead) => {
      (map[lead.stage] ?? (map[lead.stage] = [])).push(lead);
    });
    return map;
  }, [items]);

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const lead = items.find((l) => l.id === active.id);
    if (lead && lead.stage !== over.id) {
      patch.mutate({ id: active.id, stage: over.id });
    }
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES.map((stage) => (
          <div key={stage.value} className="w-72 min-w-72 shrink-0 space-y-2 rounded-xl border bg-muted/40 p-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES.map((stage) => (
          <StageColumn
            key={stage.value}
            stage={stage}
            leads={grouped[stage.value] ?? []}
            usersById={usersById}
          />
        ))}
      </div>
    </DndContext>
  );
}
