"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import OpportunityForm from "@/features/opportunities/OpportunityForm";
import { opportunityHooks } from "@/features/opportunities/hooks";

export default function NewOpportunityPage() {
  const router = useRouter();
  const create = opportunityHooks.useCreate({
    onSuccess: () => router.push("/deals"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Deal"
        description="Add a new deal to your pipeline."
      />
      <OpportunityForm
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Deal"
        onCancel={() => router.back()}
      />
    </div>
  );
}
