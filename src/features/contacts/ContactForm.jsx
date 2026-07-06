"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormInput, FormSelect, FormSwitch } from "@/components/forms/fields";
import { contactSchema } from "@/validations/contact.schema";
import { useCustomerOptions } from "@/features/contacts/hooks";

/**
 * Shared create/edit contact form.
 *   <ContactForm defaultValues={contact} onSubmit={fn} submitting submitLabel="Save changes" />
 */
export default function ContactForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save contact",
}) {
  const router = useRouter();
  const customers = useCustomerOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      jobTitle: defaultValues?.jobTitle ?? "",
      customerId: defaultValues?.customerId ?? "",
      city: defaultValues?.city ?? "",
      isPrimary: defaultValues?.isPrimary ?? false,
    },
  });

  /** Attach customerName so lists relying on it stay consistent. */
  const submit = (values) => {
    const customerName =
      customers.options.find((o) => o.value === values.customerId)?.label ??
      defaultValues?.customerName ??
      "";
    onSubmit({ ...values, customerName });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            register={register}
            name="name"
            label="Full name"
            error={errors.name}
            required
            placeholder="Jane Doe"
          />
          <FormInput
            register={register}
            name="email"
            type="email"
            label="Email"
            error={errors.email}
            required
            placeholder="jane@example.com"
          />
          <FormInput
            register={register}
            name="phone"
            type="tel"
            label="Phone"
            error={errors.phone}
            placeholder="+91 9876543210"
          />
          <FormInput
            register={register}
            name="jobTitle"
            label="Job title"
            error={errors.jobTitle}
            placeholder="VP Sales"
          />
          <FormSelect
            control={control}
            name="customerId"
            label="Customer"
            error={errors.customerId}
            required
            options={customers.options}
            placeholder={customers.isPending ? "Loading customers…" : "Select customer"}
            disabled={customers.isPending}
          />
          <FormInput register={register} name="city" label="City" error={errors.city} placeholder="Mumbai" />
          <FormSwitch
            control={control}
            name="isPrimary"
            label="Primary contact"
            hint="Mark as the main point of contact for this customer."
            className="sm:col-span-2"
          />
        </CardContent>
      </Card>

      <Separator />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
