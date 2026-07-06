"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import OpportunityForm from "@/features/opportunities/OpportunityForm";
import { opportunityHooks } from "@/features/opportunities/hooks";

export default function NewOpportunityPage() {
  const router = useRouter();
  const create = opportunityHooks.useCreate({
    onSuccess: () => router.push("/opportunities"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Opportunity"
        description="Add a new opportunity to your pipeline."
      />
      <OpportunityForm
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Opportunity"
        onCancel={() => router.back()}
      />
    </div>
  );
}
