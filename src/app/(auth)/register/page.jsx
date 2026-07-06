"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormInput, FormCheckbox } from "@/components/forms/fields";
import { registerSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function RegisterForm() {
  const { register: signup } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Start your 14-day free trial. No credit card required.
      </p>

      <form
        onSubmit={handleSubmit((values) => signup.mutate(values))}
        noValidate
        className="mt-6 space-y-4"
      >
        <FormInput
          register={register}
          name="name"
          label="Full name"
          placeholder="Jane Doe"
          error={errors.name}
          required
          autoComplete="name"
        />
        <FormInput
          register={register}
          name="email"
          type="email"
          label="Work email"
          placeholder="you@company.com"
          error={errors.email}
          required
          autoComplete="email"
        />
        <FormInput
          register={register}
          name="password"
          type="password"
          label="Password"
          placeholder="Min. 8 characters"
          error={errors.password}
          required
          autoComplete="new-password"
          hint="Use 8+ characters with a mix of upper/lowercase letters and numbers."
        />
        <FormInput
          register={register}
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />
        <FormCheckbox
          control={control}
          name="acceptTerms"
          label={
            <span>
              I agree to the{" "}
              <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and{" "}
              <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
            </span>
          }
          error={errors.acceptTerms}
        />

        <Button type="submit" className="w-full" loading={signup.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterForm />
    </Suspense>
  );
}
