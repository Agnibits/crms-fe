"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CalendarDays,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import UserAvatar from "@/components/common/UserAvatar";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TASK_STATUSES, PRIORITIES } from "@/constants/options";
import { formatDate, formatDateTime, formatRelative, titleCase } from "@/utils/format";
import { cn } from "@/utils/cn";
import { taskHooks } from "@/features/tasks/hooks";
import TaskFormDialog from "@/features/tasks/TaskFormDialog";
import { useUsersOptions } from "@/features/tasks/useUsersOptions";

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: task, isPending, error, refetch } = taskHooks.useDetail(id);
  const remove = taskHooks.useRemove();
  const { usersById } = useUsersOptions();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (error || !task) {
    return <ErrorState error={error} onRetry={refetch} title="Failed to load task" />;
  }

  const assignee = usersById?.[task.assigneeId];
  const overdue =
    task.dueDate && task.status !== "done" && new Date(task.dueDate).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        description={`Created ${formatRelative(task.createdAt)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/tasks")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={task.status} options={TASK_STATUSES} />
            <StatusBadge value={task.priority} options={PRIORITIES} />
            {task.reminder ? (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Bell className="h-3.5 w-3.5" /> Reminder on
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BellOff className="h-3.5 w-3.5" /> No reminder
              </span>
            )}
          </div>
          <CardTitle className="pt-2 text-base">Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">{task.description}</p>
              <Separator />
            </>
          )}

          <DetailRow label="Due date">
            <span
              className={cn(
                "flex items-center gap-1.5",
                overdue && "text-red-600 dark:text-red-400"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {formatDate(task.dueDate)}
              {overdue && <span className="text-xs font-semibold">(overdue)</span>}
            </span>
          </DetailRow>

          <DetailRow label="Assignee">
            {assignee ? (
              <span className="flex items-center gap-2">
                <UserAvatar name={assignee.name} className="h-6 w-6 text-[10px]" />
                {assignee.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </DetailRow>

          <DetailRow label="Related to">
            {task.relatedTo?.id ? (
              <Link
                href={`/${task.relatedTo.type}s/${task.relatedTo.id}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                {task.relatedTo.name || titleCase(task.relatedTo.type)}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailRow>

          <DetailRow label="Created">{formatDateTime(task.createdAt)}</DetailRow>
        </CardContent>
      </Card>

      <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(task.id, { onSuccess: () => router.push("/tasks") })
        }
      />
    </div>
  );
}
