"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import OpportunityForm from "@/features/opportunities/OpportunityForm";
import { opportunityHooks } from "@/features/opportunities/hooks";

export default function EditOpportunityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: opportunity, isPending, error, refetch } = opportunityHooks.useDetail(id);
  const update = opportunityHooks.useUpdate({
    onSuccess: () => router.push(`/opportunities/${id}`),
  });

  if (isPending) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit Opportunity" description={opportunity?.name} />
      <OpportunityForm
        defaultValues={opportunity}
        onSubmit={(values) => update.mutate({ id, ...values })}
        submitting={update.isPending}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
      />
    </div>
  );
}
