"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MessageSquare, Smartphone, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/fields";
import AiEmailDialog from "@/features/ai/AiEmailDialog";
import { campaignSchema, CAMPAIGN_AUDIENCES } from "@/validations/campaign.schema";
import { cn } from "@/utils/cn";

const AUDIENCE_OPTIONS = CAMPAIGN_AUDIENCES.map((a) => ({ value: a, label: a }));

const TYPE_OPTIONS = [
  { value: "email", label: "Email", icon: Mail, hint: "Rich subject + body sent to inboxes" },
  { value: "sms", label: "SMS", icon: MessageSquare, hint: "Short 160-character text message" },
];

export default function CampaignForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Create Campaign",
  onCancel,
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "email",
      subject: "",
      body: "",
      message: "",
      audience: "",
      scheduledAt: "",
      ...defaultValues,
    },
  });

  const [aiOpen, setAiOpen] = useState(false);
  const type = watch("type");
  const name = watch("name");
  const subject = watch("subject");
  const body = watch("body");
  const message = watch("message") ?? "";

  const submit = (values) => {
    const payload = {
      name: values.name.trim(),
      type: values.type,
      audience: values.audience,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
    };
    if (values.type === "email") {
      payload.subject = values.subject?.trim() ?? "";
      payload.body = values.body ?? "";
    } else {
      payload.message = values.message?.trim() ?? "";
    }
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Step 1 — channel */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">1. Choose channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Campaign type">
            {TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setValue("type", option.value, { shouldValidate: true })}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-muted-foreground/40 hover:bg-muted/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {errors.type.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — details & content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">2. Campaign details</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4 text-primary" /> Draft with AI
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              register={register}
              name="name"
              label="Campaign name"
              required
              error={errors.name}
              placeholder="e.g. Spring Promo"
            />
            <FormSelect
              control={control}
              name="audience"
              label="Audience"
              required
              error={errors.audience}
              options={AUDIENCE_OPTIONS}
              placeholder="Who should receive this?"
            />
          </div>

          {type === "email" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <FormInput
                  register={register}
                  name="subject"
                  label="Subject line"
                  required
                  error={errors.subject}
                  placeholder="Don't miss this — limited time offer inside"
                />
                <FormTextarea
                  register={register}
                  name="body"
                  label="Email body"
                  error={errors.body}
                  rows={10}
                  placeholder={"Hi there,\n\nWrite your email content here…"}
                  hint="Plain text — line breaks are preserved."
                />
              </div>
              {/* Live inbox preview */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Inbox preview</p>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">AgniBits CRM</p>
                        <p className="text-xs text-muted-foreground">to: {watch("audience") || "your audience"}</p>
                      </div>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold">
                      {subject || "Your subject line appears here"}
                    </p>
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
                      {body || "The first lines of your email body will show up in this preview…"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <FormTextarea
                  register={register}
                  name="message"
                  label="SMS message"
                  required
                  error={errors.message}
                  rows={5}
                  maxLength={160}
                  placeholder="Short and sweet — 160 characters max."
                />
                <p
                  className={cn(
                    "text-right text-xs tabular-nums",
                    message.length >= 160 ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {message.length}/160 characters
                </p>
              </div>
              {/* Phone bubble preview */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Phone preview</p>
                <div className="flex justify-center rounded-xl border bg-muted/30 p-4">
                  <div className="w-full max-w-[260px] rounded-[1.5rem] border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 border-b pb-2">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">AGNIBT</p>
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
                      {message || "Your SMS text will appear here…"}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3 — schedule */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">3. Schedule (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              register={register}
              name="scheduledAt"
              label="Send at"
              type="datetime-local"
              error={errors.scheduledAt}
              hint="Leave empty to save the campaign as a draft."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>

      <AiEmailDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        channel={type}
        recipient={watch("audience")}
        onApply={({ subject, body }) => {
          if (type === "email") {
            if (subject) setValue("subject", subject, { shouldValidate: true });
            setValue("body", body, { shouldValidate: true });
          } else {
            setValue("message", body.slice(0, 160), { shouldValidate: true });
          }
        }}
      />
    </form>
  );
}
