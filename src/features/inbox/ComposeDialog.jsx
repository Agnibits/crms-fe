"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms/fields";
import TemplatePicker from "@/features/email/TemplatePicker";
import { useSendEmail } from "./hooks";

const schema = z.object({
  to: z.string().min(1, "Recipient is required").email("Enter a valid email"),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required"),
});

/** Compose a brand-new email (starts a conversation). */
export default function ComposeDialog({ open, onOpenChange }) {
  const send = useSendEmail();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { to: "", subject: "", body: "" },
  });

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = (values) => send.mutate(values, { onSuccess: close });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
          <DialogDescription>Sent from your connected company inbox.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormInput register={register} name="to" type="email" label="To" placeholder="customer@example.com" required error={errors.to} />
          <FormInput register={register} name="subject" label="Subject" placeholder="How can we help?" required error={errors.subject} />
          <FormTextarea register={register} name="body" label="Message" rows={8} required error={errors.body} />
          <DialogFooter className="sm:justify-between">
            {/* A fresh email has no customer in context yet, so placeholders
                that depend on one resolve to empty — the sender fills those in
                before sending. Company and sender details still come through. */}
            <TemplatePicker
              disabled={send.isPending}
              onInsert={({ subject, body }) => {
                if (subject) setValue("subject", subject, { shouldValidate: true });
                if (body) setValue("body", body, { shouldValidate: true });
              }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={close} disabled={send.isPending}>
                Cancel
              </Button>
              <Button type="submit" loading={send.isPending}>
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
