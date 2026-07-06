"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import DealForm from "@/features/deals/DealForm";
import { dealHooks } from "@/features/deals/hooks";

export default function NewDealPage() {
  const router = useRouter();
  const create = dealHooks.useCreate({ onSuccess: () => router.push("/deals") });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Deal" description="Add a new deal to your pipeline." />
      <DealForm
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Deal"
        onCancel={() => router.back()}
      />
    </div>
  );
}
