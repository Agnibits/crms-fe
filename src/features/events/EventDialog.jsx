"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect } from "@/components/forms/fields";
import { eventSchema } from "@/validations/event.schema";
import { eventHooks, EVENT_TYPES } from "./hooks";

/** ISO string → value usable by <input type="datetime-local"> (local time). */
function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toFormValues(event, defaults) {
  if (event) {
    return {
      title: event.title ?? "",
      type: event.type ?? "meeting",
      start: toLocalInput(event.start),
      end: toLocalInput(event.end),
      location: event.location ?? "",
    };
  }
  const start = defaults?.start ? new Date(defaults.start) : null;
  const end = defaults?.end
    ? new Date(defaults.end)
    : start
      ? new Date(start.getTime() + 60 * 60_000)
      : null;
  return {
    title: "",
    type: defaults?.type ?? "meeting",
    start: start ? toLocalInput(start.toISOString()) : "",
    end: end ? toLocalInput(end.toISOString()) : "",
    location: "",
  };
}

/**
 * Create / edit a calendar event.
 *   <EventDialog open={open} onOpenChange={setOpen} event={eventOrNull}
 *     defaults={{ start: dateStr }} />
 */
export default function EventDialog({ open, onOpenChange, event = null, defaults = null }) {
  const isEdit = !!event?.id;
  const create = eventHooks.useCreate();
  const update = eventHooks.useUpdate();
  const remove = eventHooks.useRemove();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: toFormValues(event, defaults),
  });

  useEffect(() => {
    if (open) reset(toFormValues(event, defaults));
  }, [open, event, defaults, reset]);

  const mutation = isEdit ? update : create;

  function onSubmit(values) {
    const payload = {
      title: values.title,
      type: values.type,
      start: new Date(values.start).toISOString(),
      end: new Date(values.end).toISOString(),
      allDay: false,
      location: values.location || "",
    };
    if (isEdit) {
      update.mutate({ id: event.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the event details below."
              : "Schedule a meeting, follow-up or reminder."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            register={register}
            name="title"
            label="Title"
            required
            error={errors.title}
            placeholder="e.g. Demo with Acme Corp"
          />
          <FormSelect
            control={control}
            name="type"
            label="Type"
            required
            error={errors.type}
            options={EVENT_TYPES}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              register={register}
              name="start"
              label="Starts"
              type="datetime-local"
              required
              error={errors.start}
            />
            <FormInput
              register={register}
              name="end"
              label="Ends"
              type="datetime-local"
              required
              error={errors.end}
            />
          </div>
          <FormInput
            register={register}
            name="location"
            label="Location"
            error={errors.location}
            placeholder="e.g. Google Meet or office address"
          />

          <DialogFooter className={isEdit ? "sm:justify-between" : undefined}>
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(event.id, { onSuccess: () => onOpenChange(false) })
                }
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
