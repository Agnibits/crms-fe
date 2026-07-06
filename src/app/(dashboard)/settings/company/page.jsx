"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormTextarea } from "@/components/forms/fields";
import { companySchema } from "@/validations/settings.schema";
import { useSetting, useUpdateSetting } from "@/features/settings/hooks";

export default function CompanySettingsPage() {
  const { data, isPending, error, refetch } = useSetting("company");
  const update = useUpdateSetting("company");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    values: {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      website: data?.website || "",
      address: data?.address || "",
      gstin: data?.gstin || "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Profile</CardTitle>
        <CardDescription>These details appear on quotes, invoices and emails.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => update.mutate(values))} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput register={register} name="name" label="Company name" error={errors.name} required className="sm:col-span-2" />
              <FormInput register={register} name="email" type="email" label="Email" error={errors.email} required />
              <FormInput register={register} name="phone" type="tel" label="Phone" error={errors.phone} />
              <FormInput register={register} name="website" type="url" label="Website" error={errors.website} placeholder="https://…" />
              <FormInput register={register} name="gstin" label="GSTIN / Tax ID" error={errors.gstin} />
              <FormTextarea register={register} name="address" label="Address" error={errors.address} className="sm:col-span-2" rows={3} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
