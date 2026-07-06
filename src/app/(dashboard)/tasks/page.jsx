"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Bell,
  CalendarDays,
  Eye,
  KanbanSquare,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import UserAvatar from "@/components/common/UserAvatar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import DataTable from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TASK_STATUSES, PRIORITIES } from "@/constants/options";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { taskHooks } from "@/features/tasks/hooks";
import TaskBoard from "@/features/tasks/TaskBoard";
import TaskFormDialog from "@/features/tasks/TaskFormDialog";
import { useUsersOptions } from "@/features/tasks/useUsersOptions";
import { TASK_DUE_COLOR } from "@/features/events/hooks";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

export default function TasksPage() {
  const router = useRouter();
  const t = useTableState();
  const { usersById } = useUsersOptions();

  // Board + calendar need the full set; the list tab stays server-paginated.
  const board = taskHooks.useList({ limit: 200 });
  const list = taskHooks.useList(t.queryParams);
  const remove = taskHooks.useRemove();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const allTasks = board.data?.items ?? [];

  function openCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  const calendarEvents = useMemo(
    () =>
      allTasks
        .filter((task) => task.dueDate)
        .map((task) => ({
          id: task.id,
          title: task.title,
          start: task.dueDate,
          allDay: true,
          backgroundColor: TASK_DUE_COLOR,
          borderColor: TASK_DUE_COLOR,
        })),
    [allTasks]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 font-medium">
            {row.original.title}
            {row.original.reminder && (
              <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge value={row.original.status} options={TASK_STATUSES} />,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <StatusBadge value={row.original.priority} options={PRIORITIES} />,
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: ({ row }) => {
          const overdue =
            row.original.dueDate &&
            row.original.status !== "done" &&
            new Date(row.original.dueDate).getTime() < Date.now();
          return (
            <span className={cn(overdue && "font-medium text-red-600 dark:text-red-400")}>
              {formatDate(row.original.dueDate)}
            </span>
          );
        },
      },
      {
        accessorKey: "assigneeId",
        header: "Assignee",
        enableSorting: false,
        cell: ({ row }) => {
          const user = usersById?.[row.original.assigneeId];
          return user ? (
            <span className="flex items-center gap-2">
              <UserAvatar name={user.name} className="h-6 w-6 text-[10px]" />
              <span className="truncate">{user.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
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
                aria-label="Task actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/tasks/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTask(row.original)}
              >
                <Trash2 className="h-4 w-4" /> Delete
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
        title="Tasks"
        description="Plan, track and complete your team's work."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">
            <KanbanSquare className="h-4 w-4" /> Board
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {board.error ? (
            <ErrorState error={board.error} onRetry={board.refetch} />
          ) : (
            <TaskBoard
              tasks={allTasks}
              loading={board.isPending}
              onEdit={openEdit}
              onDelete={(task) => setDeleteTask(task)}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {board.isPending ? (
                <LoadingSpinner label="Loading calendar…" />
              ) : board.error ? (
                <ErrorState error={board.error} onRetry={board.refetch} />
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                  events={calendarEvents}
                  eventClick={(info) => {
                    const task = allTasks.find((item) => item.id === info.event.id);
                    if (task) openEdit(task);
                  }}
                  dayMaxEventRows={4}
                  height="auto"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
            onRowClick={(row) => router.push(`/tasks/${row.id}`)}
            searchPlaceholder="Search tasks…"
            emptyTitle="No tasks found"
            toolbar={
              <>
                <Select
                  value={t.filters.status ?? "all"}
                  onValueChange={(v) => t.setFilter("status", v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="w-[150px]" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={t.filters.priority ?? "all"}
                  onValueChange={(v) => t.setFilter("priority", v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="w-[150px]" aria-label="Filter by priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </TabsContent>
      </Tabs>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editingTask} />

      <ConfirmDialog
        open={!!deleteTask}
        onOpenChange={() => setDeleteTask(null)}
        destructive
        title="Delete task?"
        description={
          deleteTask ? `"${deleteTask.title}" will be permanently deleted.` : undefined
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(deleteTask.id, { onSuccess: () => setDeleteTask(null) })
        }
      />
    </div>
  );
}
