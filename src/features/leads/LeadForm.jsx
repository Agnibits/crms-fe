"use client";

import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormAutocomplete,
  FormInput,
  FormNumber,
  FormSelect,
  FormTextarea,
} from "@/components/forms/fields";
import { LEAD_STAGES_PICKABLE, LEAD_SOURCES, LEAD_RATINGS } from "@/constants/options";
import { leadSchema } from "@/validations/lead.schema";
import { leadService } from "@/services/lead.service";
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

  // Cities this company has already used — real data, not a hardcoded list.
  const { data: citySuggestions = [] } = useQuery({
    queryKey: ["leads", "cities"],
    queryFn: ({ signal }) => leadService.cities({ signal }),
    staleTime: 5 * 60 * 1000,
  });

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
      rating: "warm",
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
            options={LEAD_STAGES_PICKABLE}
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
          <FormSelect
            control={control}
            name="rating"
            label="Rating"
            options={LEAD_RATINGS}
            hint="Gut feel: how hot is this lead right now?"
            error={errors.rating}
          />
          <FormSelect
            control={control}
            name="ownerId"
            label="Owner"
            options={userOptions}
            placeholder="Defaults to you"
            hint="Who follows up on this lead. Left empty = assigned to you."
            error={errors.ownerId}
          />
          <FormAutocomplete
            control={control}
            name="city"
            label="City"
            placeholder="e.g. Kathmandu"
            suggestions={citySuggestions}
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
