"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/fields";
import { forgotPasswordSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const [sentTo, setSentTo] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <MailCheck className="h-6 w-6 text-success" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a password reset link to <span className="font-medium text-foreground">{sentTo}</span>.
          The link expires in 30 minutes.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Forgot your password?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form
        onSubmit={handleSubmit((values) =>
          forgotPassword.mutate(values, { onSuccess: () => setSentTo(values.email) })
        )}
        noValidate
        className="mt-6 space-y-4"
      >
        <FormInput
          register={register}
          name="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          error={errors.email}
          required
          autoComplete="email"
        />
        <Button type="submit" className="w-full" loading={forgotPassword.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
