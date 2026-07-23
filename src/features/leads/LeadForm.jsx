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
import { LEAD_STAGES, LEAD_SOURCES, LEAD_RATING } from "@/constants/options";
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
            placeholder="e.g. Acme Corp"
            // required
            error={errors.company}
          />
          <FormInput
            register={register}
            name="email"
            type="email"
            label="Email"
            placeholder="name@company.com"
            // required
            error={errors.email}
          />
          <FormInput
            register={register}
            name="phone"
            label="Phone"
            placeholder="+91 98765 43210"
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
            placeholder="e.g. 50,000"
            error={errors.value}
          />
          <FormSelect
            control={control}
            name="rating"
            label="Rating"
            placeholder="Rate your experience"
            options={LEAD_RATING}
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
