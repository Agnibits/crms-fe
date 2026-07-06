"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import ContactForm from "@/features/contacts/ContactForm";
import { contactHooks } from "@/features/contacts/hooks";

export default function EditContactPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: contact, isPending, error, refetch } = contactHooks.useDetail(id);
  const update = contactHooks.useUpdate();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Contact"
        description={contact ? `Update details for ${contact.name}.` : "Update contact details."}
      />

      {isPending ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <ContactForm
          defaultValues={contact}
          submitLabel="Save changes"
          submitting={update.isPending}
          onSubmit={(values) =>
            update.mutate(
              { id, ...values },
              { onSuccess: () => router.push(`/contacts/${id}`) }
            )
          }
        />
      )}
    </div>
  );
}
