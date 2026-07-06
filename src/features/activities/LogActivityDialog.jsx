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
  FormNumber,
} from "@/components/forms/fields";
import { ACTIVITY_TYPES } from "@/constants/options";
import { activitySchema } from "@/validations/activity.schema";
import { useAuthStore } from "@/store/auth.store";
import { activityHooks } from "./hooks";

const EMPTY_VALUES = {
  type: "call",
  subject: "",
  description: "",
  duration: "",
};

/**
 * Log a new activity (call / meeting / email / note / whatsapp / sms).
 *   <LogActivityDialog open={open} onOpenChange={setOpen} />
 */
export default function LogActivityDialog({ open, onOpenChange }) {
  const create = activityHooks.useCreate();
  const user = useAuthStore((s) => s.user);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const type = watch("type");
  const showDuration = type === "call" || type === "meeting";

  function onSubmit(values) {
    const payload = {
      type: values.type,
      subject: values.subject,
      description: values.description || "",
      duration: showDuration && values.duration ? Number(values.duration) : null,
      userId: user?.id ?? null,
      userName: user?.name ?? "You",
      createdAt: new Date().toISOString(),
    };
    create.mutate(payload, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Record a call, meeting, email or note against your pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSelect
            control={control}
            name="type"
            label="Type"
            required
            error={errors.type}
            options={ACTIVITY_TYPES}
          />
          <FormInput
            register={register}
            name="subject"
            label="Subject"
            required
            error={errors.subject}
            placeholder="e.g. Call with John — pricing discussion"
          />
          <FormTextarea
            register={register}
            name="description"
            label="Description"
            error={errors.description}
            placeholder="What was discussed?"
            rows={3}
          />
          {showDuration && (
            <FormNumber
              register={register}
              name="duration"
              label="Duration (minutes)"
              error={errors.duration}
              placeholder="30"
              min={1}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Log Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
