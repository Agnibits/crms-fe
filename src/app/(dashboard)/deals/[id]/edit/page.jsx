"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import DealForm from "@/features/deals/DealForm";
import { dealHooks } from "@/features/deals/hooks";

export default function EditDealPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: deal, isPending, error, refetch } = dealHooks.useDetail(id);
  const update = dealHooks.useUpdate({ onSuccess: () => router.push(`/deals/${id}`) });

  if (isPending) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit Deal" description={deal?.name} />
      <DealForm
        defaultValues={deal}
        onSubmit={(values) => update.mutate({ id, ...values })}
        submitting={update.isPending}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
      />
    </div>
  );
}
