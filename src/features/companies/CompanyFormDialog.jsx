"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/forms/fields";
import { companySchema } from "@/validations/company.schema";
import { useCreateCompany } from "@/features/companies/hooks";

/** Super Admin → onboard a new tenant company and its first ADMIN. */
export default function CompanyFormDialog({ open, onOpenChange }) {
  const create = useCreateCompany();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      email: "",
      currency: "USD",
      country: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = (values) =>
    create.mutate(values, {
      onSuccess: close,
      onError: (err) => {
        const fields = err?.response?.data?.errors;
        if (Array.isArray(fields)) {
          fields.forEach((f) => f.field && setError(f.field, { type: "server", message: f.message }));
        }
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add company</DialogTitle>
          <DialogDescription>
            Create a tenant and its first administrator. The admin can sign in immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              register={register}
              name="name"
              label="Company name"
              error={errors.name}
              required
              placeholder="Client Co"
              className="sm:col-span-2"
            />
            <FormInput register={register} name="email" type="email" label="Company email" error={errors.email} placeholder="info@client.com" />
            <FormInput register={register} name="country" label="Country" error={errors.country} placeholder="India" />
            <FormInput register={register} name="currency" label="Currency (3-letter)" error={errors.currency} placeholder="INR" />
          </div>

          <Separator />
          <p className="text-sm font-medium">First administrator</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput register={register} name="adminFirstName" label="First name" error={errors.adminFirstName} required placeholder="Ravi" />
            <FormInput register={register} name="adminLastName" label="Last name" error={errors.adminLastName} required placeholder="Kumar" />
            <FormInput register={register} name="adminEmail" type="email" label="Admin email" error={errors.adminEmail} required placeholder="admin@client.com" />
            <FormInput register={register} name="adminPassword" type="password" label="Temporary password" error={errors.adminPassword} required placeholder="At least 8 characters" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
