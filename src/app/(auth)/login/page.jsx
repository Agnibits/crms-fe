"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormInput, FieldWrapper, FormCheckbox } from "@/components/forms/fields";
import { loginSchema } from "@/validations/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { USE_MOCK } from "@/constants/app";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: USE_MOCK ? "admin@agnibits.com" : "", password: USE_MOCK ? "Password123" : "", remember: true },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your account to continue.
      </p>

      {USE_MOCK && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Demo mode:</span> any email/password works.
          Prefilled admin credentials are ready — just press Sign in.
        </div>
      )}

      <form
        onSubmit={handleSubmit((values) => login.mutate(values))}
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
        <FieldWrapper label="Password" name="password" error={errors.password} required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FieldWrapper>

        <div className="flex items-center justify-between">
          <FormCheckbox control={control} name="remember" label="Remember me" />
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
