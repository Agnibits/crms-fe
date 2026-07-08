"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea, FormSwitch } from "@/components/forms/fields";
import { emailTemplateHooks } from "./templateHooks";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required"),
  isActive: z.boolean().optional(),
});

/** Create / edit an email template. Pass `template={null}` to create. */
export default function TemplateDialog({ open, onOpenChange, template = null }) {
  const isEdit = !!template?.id;
  const create = emailTemplateHooks.useCreate();
  const update = emailTemplateHooks.useUpdate();
  const submitting = create.isPending || update.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
      isActive: template?.isActive ?? true,
    },
  });

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = (values) => {
    if (isEdit) update.mutate({ id: template.id, ...values }, { onSuccess: close });
    else create.mutate(values, { onSuccess: close });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormInput register={register} name="name" label="Template name" placeholder="Welcome email" required error={errors.name} />
          <FormInput register={register} name="subject" label="Subject" placeholder="Welcome to {{company}}" required error={errors.subject} />
          <FormTextarea register={register} name="body" label="Body" rows={8} required error={errors.body} />
          <FormSwitch control={control} name="isActive" label="Active" hint="Inactive templates are hidden from the composer." />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
