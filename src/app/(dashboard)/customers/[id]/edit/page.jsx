"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerForm from "@/features/customers/CustomerForm";
import { customerHooks } from "@/features/customers/hooks";

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: customer, isPending, error, refetch } = customerHooks.useDetail(id);
  const update = customerHooks.useUpdate();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Customer"
        description={customer ? `Update details for ${customer.name}.` : "Update customer details."}
      />

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <CustomerForm
          defaultValues={customer}
          submitLabel="Save changes"
          submitting={update.isPending}
          onSubmit={(values) =>
            update.mutate(
              { id, ...values },
              { onSuccess: () => router.push(`/customers/${id}`) }
            )
          }
        />
      )}
    </div>
  );
}
