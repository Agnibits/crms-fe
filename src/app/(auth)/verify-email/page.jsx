"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailOpen, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const justSent = searchParams.get("sent");
  const [status, setStatus] = useState(token ? "verifying" : "waiting");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch((err) => {
        setError(getErrorMessage(err));
        setStatus("failed");
      });
  }, [token]);

  if (status === "verifying") {
    return <LoadingSpinner label="Verifying your email…" />;
  }

  if (status === "verified") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">Email verified!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your email has been verified. You now have full access to your workspace.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">Verification failed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "This verification link is invalid or has expired."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <MailOpen className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">Verify your email</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {justSent
          ? "We just sent a verification link to your inbox. Click it to activate your account."
          : "Check your inbox for the verification link we sent you."}
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
