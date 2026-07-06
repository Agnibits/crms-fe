"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import LeadForm from "@/features/leads/LeadForm";
import { leadHooks } from "@/features/leads/hooks";

export default function NewLeadPage() {
  const router = useRouter();
  const create = leadHooks.useCreate({ onSuccess: () => router.push("/leads") });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Lead" description="Add a new lead to your pipeline." />
      <LeadForm
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Lead"
        onCancel={() => router.back()}
      />
    </div>
  );
}
