"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormDatePicker,
  FormInput,
  FormNumber,
  FormSelect,
} from "@/components/forms/fields";
import { DEAL_STAGES } from "@/constants/options";
import { opportunitySchema } from "@/validations/opportunity.schema";
import { useUsersOptions } from "@/features/leads/useUsersOptions";

/** Shared create/edit opportunity form. */
export default function OpportunityForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save Opportunity",
  onCancel,
}) {
  const { options: userOptions } = useUsersOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      name: "",
      customerName: "",
      stage: "qualification",
      amount: "",
      probability: "",
      expectedCloseDate: "",
      ownerId: "",
      ...defaultValues,
      // <input type="date"> needs yyyy-MM-dd
      ...(defaultValues?.expectedCloseDate
        ? { expectedCloseDate: String(defaultValues.expectedCloseDate).slice(0, 10) }
        : {}),
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            register={register}
            name="name"
            label="Opportunity Name"
            placeholder="e.g. Acme Corp — Expansion"
            required
            error={errors.name}
            className="sm:col-span-2"
          />
          <FormInput
            register={register}
            name="customerName"
            label="Customer"
            placeholder="e.g. Acme Corp"
            required
            error={errors.customerName}
          />
          <FormSelect
            control={control}
            name="stage"
            label="Stage"
            required
            options={DEAL_STAGES}
            error={errors.stage}
          />
          <FormNumber
            register={register}
            name="amount"
            label="Amount"
            placeholder="0"
            required
            min={0}
            error={errors.amount}
          />
          <FormNumber
            register={register}
            name="probability"
            label="Probability (%)"
            placeholder="0–100"
            required
            min={0}
            max={100}
            error={errors.probability}
          />
          <FormDatePicker
            register={register}
            name="expectedCloseDate"
            label="Expected Close Date"
            required
            error={errors.expectedCloseDate}
          />
          <FormSelect
            control={control}
            name="ownerId"
            label="Owner"
            options={userOptions}
            placeholder="Assign an owner…"
            error={errors.ownerId}
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
