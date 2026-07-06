"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import CustomerForm from "@/features/customers/CustomerForm";
import { customerHooks } from "@/features/customers/hooks";

export default function NewCustomerPage() {
  const router = useRouter();
  const create = customerHooks.useCreate();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add Customer"
        description="Create a new customer account."
      />
      <CustomerForm
        submitLabel="Create customer"
        submitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, { onSuccess: () => router.push("/customers") })
        }
      />
    </div>
  );
}
