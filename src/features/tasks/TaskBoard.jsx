"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Bell, CalendarDays, ClipboardList, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import UserAvatar from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TASK_STATUSES, TASK_BOARD_STATUSES, PRIORITIES } from "@/constants/options";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { taskHooks } from "./hooks";
import { useUsersOptions } from "./useUsersOptions";

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function TaskCardContent({ task, usersById, onEdit, onDelete, dragging }) {
  const assignee = usersById?.[task.assigneeId];
  const overdue = isOverdue(task);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-90 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{task.title}</p>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-1 -mt-1 h-7 w-7 shrink-0"
                aria-label="Task actions"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(task)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <StatusBadge value={task.priority} options={PRIORITIES} />
        {task.reminder && (
          <span
            title="Reminder set"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            <Bell className="h-3 w-3" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p
          className={cn(
            "flex items-center gap-1 text-xs",
            overdue ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-3 w-3" /> {formatDate(task.dueDate)}
        </p>
        {assignee && (
          <UserAvatar name={assignee.name} className="h-6 w-6 text-[10px]" />
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task, usersById, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <TaskCardContent task={task} usersById={usersById} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function BoardColumn({ status, tasks, usersById, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });

  return (
    <div className="flex w-72 shrink-0 flex-col sm:w-80 lg:w-auto lg:min-w-0 lg:flex-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <StatusBadge value={status.value} options={TASK_STATUSES} />
          <Badge variant="secondary" className="tabular-nums">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[220px] flex-1 flex-col gap-2 rounded-xl border bg-muted/40 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks"
            description="Drag a card here or create a new task."
            className="flex-1 border-0 py-8"
          />
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              usersById={usersById}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Kanban board over TASK_STATUSES with @dnd-kit drag & drop.
 *   <TaskBoard tasks={items} loading={isPending} onEdit={fn} onDelete={fn} />
 */
export default function TaskBoard({ tasks = [], loading = false, onEdit, onDelete }) {
  const patch = taskHooks.usePatch();
  const { usersById } = useUsersOptions();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event) {
    setActiveTask(event.active.data.current?.task ?? null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const task = active.data.current?.task;
    const newStatus = String(over.id);
    if (!task || task.status === newStatus) return;
    patch.mutate({ id: task.id, status: newStatus });
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_BOARD_STATUSES.map((status) => (
          <div key={status.value} className="w-72 shrink-0 space-y-2 sm:w-80 lg:w-auto lg:min-w-0 lg:flex-1">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
        {TASK_BOARD_STATUSES.map((status) => (
          <BoardColumn
            key={status.value}
            status={status}
            tasks={tasks.filter((task) => task.status === status.value)}
            usersById={usersById}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCardContent task={activeTask} usersById={usersById} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
