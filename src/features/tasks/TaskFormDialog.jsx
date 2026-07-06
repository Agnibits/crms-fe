"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormDatePicker,
  FormSwitch,
} from "@/components/forms/fields";
import { TASK_STATUSES, PRIORITIES } from "@/constants/options";
import { taskSchema } from "@/validations/task.schema";
import { taskHooks } from "./hooks";
import { useUsersOptions } from "./useUsersOptions";

const EMPTY_VALUES = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  reminder: false,
  assigneeId: "",
};

function toFormValues(task) {
  if (!task) return EMPTY_VALUES;
  return {
    title: task.title ?? "",
    description: task.description ?? "",
    status: task.status ?? "todo",
    priority: task.priority ?? "medium",
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    reminder: !!task.reminder,
    assigneeId: task.assigneeId ?? "",
  };
}

/**
 * Create / edit a task inside a dialog.
 *   <TaskFormDialog open={open} onOpenChange={setOpen} task={taskOrNull} />
 */
export default function TaskFormDialog({ open, onOpenChange, task = null }) {
  const isEdit = !!task?.id;
  const create = taskHooks.useCreate();
  const update = taskHooks.useUpdate();
  const { options: userOptions, isPending: usersLoading } = useUsersOptions();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: toFormValues(task),
  });

  useEffect(() => {
    if (open) reset(toFormValues(task));
  }, [open, task, reset]);

  const mutation = isEdit ? update : create;

  function onSubmit(values) {
    const payload = {
      ...values,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      assigneeId: values.assigneeId || null,
    };
    if (isEdit) {
      update.mutate({ id: task.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            register={register}
            name="title"
            label="Title"
            required
            error={errors.title}
            placeholder="e.g. Follow up with Acme Corp"
          />
          <FormTextarea
            register={register}
            name="description"
            label="Description"
            error={errors.description}
            placeholder="Add more context…"
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              control={control}
              name="status"
              label="Status"
              required
              error={errors.status}
              options={TASK_STATUSES}
            />
            <FormSelect
              control={control}
              name="priority"
              label="Priority"
              required
              error={errors.priority}
              options={PRIORITIES}
            />
            <FormDatePicker
              register={register}
              name="dueDate"
              label="Due date"
              error={errors.dueDate}
            />
            <FormSelect
              control={control}
              name="assigneeId"
              label="Assignee"
              error={errors.assigneeId}
              options={userOptions}
              placeholder={usersLoading ? "Loading users…" : "Select assignee…"}
              disabled={usersLoading}
            />
          </div>
          <FormSwitch
            control={control}
            name="reminder"
            label="Reminder"
            hint="Get notified before the due date."
            error={errors.reminder}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
