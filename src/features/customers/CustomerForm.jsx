"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FormInput,
  FormNumber,
  FormSelect,
  FormTextarea,
} from "@/components/forms/fields";
import { customerSchema } from "@/validations/customer.schema";
import { CUSTOMER_STATUSES } from "@/constants/options";

/**
 * Shared create/edit customer form.
 *   <CustomerForm defaultValues={customer} onSubmit={fn} submitting submitLabel="Save changes" />
 */
export default function CustomerForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save customer",
}) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      contactName: defaultValues?.contactName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      website: defaultValues?.website ?? "",
      industry: defaultValues?.industry ?? "",
      status: defaultValues?.status ?? "active",
      city: defaultValues?.city ?? "",
      country: defaultValues?.country ?? "",
      address: defaultValues?.address ?? "",
      employees: defaultValues?.employees ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            register={register}
            name="name"
            label="Company name"
            error={errors.name}
            required
            placeholder="Acme Corp"
          />
          <FormInput
            register={register}
            name="contactName"
            label="Primary contact"
            error={errors.contactName}
            placeholder="Jane Doe"
          />
          <FormInput
            register={register}
            name="email"
            type="email"
            label="Email"
            error={errors.email}
            required
            placeholder="hello@acme.com"
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
            name="website"
            label="Website"
            error={errors.website}
            placeholder="https://www.acme.com"
          />
          <FormInput
            register={register}
            name="industry"
            label="Industry"
            error={errors.industry}
            placeholder="Technology"
          />
          <FormSelect
            control={control}
            name="status"
            label="Status"
            error={errors.status}
            required
            options={CUSTOMER_STATUSES}
            placeholder="Select status"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location &amp; company size</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput register={register} name="city" label="City" error={errors.city} placeholder="Pune" />
          <FormInput
            register={register}
            name="country"
            label="Country"
            error={errors.country}
            placeholder="India"
          />
          <FormInput
            register={register}
            name="address"
            label="Address"
            error={errors.address}
            placeholder="4th Floor, Tech Park One"
            className="sm:col-span-2"
          />
          <FormNumber
            register={register}
            name="employees"
            label="Employees"
            error={errors.employees}
            min={0}
            placeholder="50"
          />
          <FormTextarea
            register={register}
            name="notes"
            label="Notes"
            error={errors.notes}
            rows={4}
            placeholder="Anything worth remembering about this customer…"
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
