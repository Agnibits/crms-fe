"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import CampaignForm from "@/features/campaigns/CampaignForm";
import { campaignHooks } from "@/features/campaigns/hooks";

export default function NewCampaignPage() {
  const router = useRouter();
  const create = campaignHooks.useCreate({ onSuccess: () => router.push("/marketing") });

  const handleSubmit = (values) => {
    create.mutate({
      ...values,
      status: values.scheduledAt ? "scheduled" : "draft",
      sent: 0,
      opened: 0,
      clicked: 0,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="New Campaign"
        description="Pick a channel, craft your content and schedule the send."
      />
      <CampaignForm
        onSubmit={handleSubmit}
        submitting={create.isPending}
        submitLabel="Create Campaign"
        onCancel={() => router.push("/marketing")}
      />
    </div>
  );
}
