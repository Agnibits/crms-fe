"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import OpportunityForm from "@/features/opportunities/OpportunityForm";
import { opportunityHooks } from "@/features/opportunities/hooks";

/** Supports prefill via ?customerId=… so a customer can start a deal directly. */
function NewDealInner() {
  const router = useRouter();
  const params = useSearchParams();
  const create = opportunityHooks.useCreate({ onSuccess: () => router.push("/deals") });

  const customerId = params.get("customerId") ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Deal" description="Add a new deal to your pipeline." />
      <OpportunityForm
        defaultValues={customerId ? { customerId } : undefined}
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Deal"
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewDealInner />
    </Suspense>
  );
}
