"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import LeadForm from "@/features/leads/LeadForm";
import { leadHooks } from "@/features/leads/hooks";

export default function EditLeadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: lead, isPending, error, refetch } = leadHooks.useDetail(id);
  const update = leadHooks.useUpdate({ onSuccess: () => router.push(`/leads/${id}`) });

  if (isPending) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit Lead" description={lead?.name} />
      <LeadForm
        defaultValues={lead}
        onSubmit={(values) => update.mutate({ id, ...values })}
        submitting={update.isPending}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
      />
    </div>
  );
}
