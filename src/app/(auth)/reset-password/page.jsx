"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/fields";
import { resetPasswordSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Set a new password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a strong password you haven&apos;t used before.
      </p>

      {!token && (
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          This reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            forgot password
          </Link>{" "}
          page.
        </div>
      )}

      <form
        onSubmit={handleSubmit((values) =>
          resetPassword.mutate({ token, password: values.password })
        )}
        noValidate
        className="mt-6 space-y-4"
      >
        <FormInput
          register={register}
          name="password"
          type="password"
          label="New password"
          placeholder="Min. 8 characters"
          error={errors.password}
          required
          autoComplete="new-password"
        />
        <FormInput
          register={register}
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" loading={resetPassword.isPending} disabled={!token}>
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
