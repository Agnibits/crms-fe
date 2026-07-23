"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import { FormInput } from "@/components/forms/fields";
import { api, toastError } from "@/services/api";
import { useMyCompany } from "@/hooks/useMyCompany";

/**
 * Edits the Company record itself — the same source the invoice/quote
 * letterhead and PDFs read — not a parallel settings store.
 */
export default function CompanySettingsPage() {
  const { company, isPending, error, refetch } = useMyCompany();
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (values) => api.put(`/organization/companies/${company.id}`, values),
    onSuccess: () => {
      toast.success("Company profile updated");
      queryClient.invalidateQueries({ queryKey: ["organization", "my-company"] });
    },
    onError: (e) => toastError(e, "Failed to update company profile"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    values: {
      name: company?.name || "",
      email: company?.email || "",
      phone: company?.phone || "",
      website: company?.website || "",
      taxId: company?.taxId || "",
      addressLine: company?.addressLine || "",
      city: company?.city || "",
      country: company?.country || "",
      logoUrl: company?.logoUrl || "",
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
        ) : isPending || !company ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((values) => update.mutate(values))}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                register={register}
                name="name"
                label="Company name"
                error={errors.name}
                required
                className="sm:col-span-2"
              />
              <FormInput register={register} name="email" type="email" label="Email" error={errors.email} />
              <FormInput register={register} name="phone" type="tel" label="Phone" error={errors.phone} />
              <FormInput
                register={register}
                name="website"
                type="url"
                label="Website"
                error={errors.website}
                placeholder="https://…"
              />
              <FormInput register={register} name="taxId" label="Tax ID / PAN / VAT" error={errors.taxId} />
              <FormInput
                register={register}
                name="addressLine"
                label="Address"
                error={errors.addressLine}
                placeholder="e.g. Suryabinayak"
                className="sm:col-span-2"
              />
              <FormInput register={register} name="city" label="City" error={errors.city} />
              <FormInput register={register} name="country" label="Country" error={errors.country} />
              <FormInput
                register={register}
                name="logoUrl"
                type="url"
                label="Logo URL"
                error={errors.logoUrl}
                hint="Shown on invoices and quotes. Paste a hosted image URL."
                className="sm:col-span-2"
              />
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
