"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/fields";
import { changePasswordSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Change Password" description="Keep your account secure with a strong password." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update password</CardTitle>
          <CardDescription>
            You&apos;ll stay signed in on this device after changing your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) =>
              changePassword.mutate(
                { currentPassword: values.currentPassword, newPassword: values.newPassword },
                { onSuccess: () => reset() }
              )
            )}
            noValidate
            className="space-y-4"
          >
            <FormInput
              register={register}
              name="currentPassword"
              type="password"
              label="Current password"
              error={errors.currentPassword}
              required
              autoComplete="current-password"
            />
            <FormInput
              register={register}
              name="newPassword"
              type="password"
              label="New password"
              error={errors.newPassword}
              required
              autoComplete="new-password"
              hint="8+ characters with upper/lowercase letters and a number."
            />
            <FormInput
              register={register}
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
            <div className="flex justify-end">
              <Button type="submit" loading={changePassword.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
