"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormNumber,
  FormSelect,
  FormTextarea,
} from "@/components/forms/fields";
import { LEAD_STAGES, LEAD_SOURCES } from "@/constants/options";
import { leadSchema } from "@/validations/lead.schema";
import { useUsersOptions } from "./useUsersOptions";

/**
 * Shared create/edit lead form.
 *   <LeadForm defaultValues={lead} onSubmit={fn} submitting={bool} onCancel={fn} />
 */
export default function LeadForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save Lead",
  onCancel,
}) {
  const { options: userOptions } = useUsersOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      stage: "new",
      source: "website",
      value: "",
      score: "",
      ownerId: "",
      city: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            register={register}
            name="name"
            label="Full Name"
            placeholder="e.g. Priya Sharma"
            required
            error={errors.name}
          />
          <FormInput
            register={register}
            name="company"
            label="Company"
            placeholder="e.g. Acme Corp (optional)"
            error={errors.company}
          />
          <FormInput
            register={register}
            name="email"
            type="email"
            label="Email"
            placeholder="name@company.com"
            hint="Email or phone — at least one is required."
            error={errors.email}
          />
          <FormInput
            register={register}
            name="phone"
            label="Phone"
            placeholder="+977 98XXXXXXXX"
            error={errors.phone}
          />
          <FormSelect
            control={control}
            name="stage"
            label="Stage"
            required
            options={LEAD_STAGES}
            error={errors.stage}
          />
          <FormSelect
            control={control}
            name="source"
            label="Source"
            required
            options={LEAD_SOURCES}
            error={errors.source}
          />
          <FormNumber
            register={register}
            name="value"
            label="Estimated Value"
            placeholder="e.g. 50,000 (optional)"
            min={0}
            error={errors.value}
          />
          <FormNumber
            register={register}
            name="score"
            label="Lead Score"
            placeholder="0–100"
            min={0}
            max={100}
            hint="How likely this lead is to convert (0–100)."
            error={errors.score}
          />
          <FormSelect
            control={control}
            name="ownerId"
            label="Owner"
            options={userOptions}
            placeholder="Assign an owner…"
            error={errors.ownerId}
          />
          <FormInput
            register={register}
            name="city"
            label="City"
            placeholder="e.g. Pune"
            error={errors.city}
          />
          <FormTextarea
            register={register}
            name="notes"
            label="Notes"
            placeholder="Anything worth remembering about this lead…"
            rows={4}
            className="sm:col-span-2"
            error={errors.notes}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
