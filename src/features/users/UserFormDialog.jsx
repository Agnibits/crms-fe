"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormInput, FormSelect } from "@/components/forms/fields";
import { userSchema } from "@/validations/user.schema";
import { ASSIGNABLE_ROLES, BACKEND_ROLE_LABELS, SUPER_ADMIN_ROLE } from "@/constants/roles";
import { userHooks } from "@/features/users/hooks";

// SUPER_ADMIN is reserved and never offered here.
const ROLE_OPTIONS = ASSIGNABLE_ROLES;

const DEPARTMENT_OPTIONS = ["Sales", "Marketing", "Support", "Operations"].map((d) => ({
  value: d,
  label: d,
}));

/**
 * Create / edit a user inside a dialog.
 *   <UserFormDialog open={open} onOpenChange={setOpen} user={editingUser} />
 * Pass `user={null}` for create mode.
 */
export default function UserFormDialog({ open, onOpenChange, user = null }) {
  const isEdit = !!user?.id;
  // The one reserved super admin is read-only — its role can't be changed here.
  const isSuperAdmin = user?.rawRole === SUPER_ADMIN_ROLE;
  const create = userHooks.useCreate();
  const update = userHooks.useUpdate();
  const submitting = create.isPending || update.isPending;

  const [active, setActive] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.rawRole ?? "USER",
      phone: user?.phone ?? "",
      department: user?.department ?? "",
    },
  });

  /** Surface backend 422 validation errors under the offending field. */
  const applyFieldErrors = (err) => {
    const fields = err?.response?.data?.errors;
    if (Array.isArray(fields)) {
      fields.forEach((f) => f.field && setError(f.field, { type: "server", message: f.message }));
    }
  };

  // Sync the status switch whenever the dialog opens for a different user.
  useEffect(() => {
    if (open) setActive(user ? user.status !== "inactive" : true);
  }, [open, user]);

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = (values) => {
    const payload = { ...values, status: active ? "active" : "inactive" };
    // Never attempt to (re)assign the reserved super admin role.
    if (isSuperAdmin) delete payload.role;
    if (isEdit) {
      update.mutate({ id: user.id, ...payload }, { onSuccess: close, onError: applyFieldErrors });
    } else {
      create.mutate(
        {
          ...payload,
          avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(values.name)}`,
          emailVerified: false,
          lastLoginAt: null,
        },
        { onSuccess: close, onError: applyFieldErrors }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's details, role and status."
              : "Invite a new member to your workspace."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              placeholder="jane@company.com"
            />
            {isSuperAdmin ? (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {BACKEND_ROLE_LABELS.SUPER_ADMIN} · reserved
                </div>
              </div>
            ) : (
              <FormSelect
                control={control}
                name="role"
                label="Role"
                error={errors.role}
                required
                options={ROLE_OPTIONS}
                placeholder="Select role"
              />
            )}
            <FormInput
              register={register}
              name="phone"
              type="tel"
              label="Phone"
              error={errors.phone}
              placeholder="+91 9876543210"
            />
            {!isEdit && (
              <FormInput
                register={register}
                name="password"
                type="password"
                label="Temporary password"
                error={errors.password}
                required
                placeholder="At least 8 characters"
                className="sm:col-span-2"
              />
            )}
            <FormSelect
              control={control}
              name="department"
              label="Department"
              error={errors.department}
              options={DEPARTMENT_OPTIONS}
              placeholder="Select department"
              className="sm:col-span-2"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="user-status">Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Inactive users can't sign in but their data is kept.
              </p>
            </div>
            <Switch id="user-status" checked={active} onCheckedChange={setActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
