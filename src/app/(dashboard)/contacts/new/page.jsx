"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ContactForm from "@/features/contacts/ContactForm";
import { contactHooks } from "@/features/contacts/hooks";

export default function NewContactPage() {
  const router = useRouter();
  const create = contactHooks.useCreate();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Add Contact" description="Create a new contact and link it to a customer." />
      <ContactForm
        submitLabel="Create contact"
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, { onSuccess: () => router.push("/contacts") })
        }
      />
    </div>
  );
}
