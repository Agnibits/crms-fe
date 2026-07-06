"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import ProductForm from "@/features/products/ProductForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { productHooks } from "@/features/products/hooks";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: product, isPending, error, refetch } = productHooks.useDetail(id);
  const update = productHooks.useUpdate({
    onSuccess: () => router.push(`/products/${id}`),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Product"
        description={product ? product.name : "Update product details."}
        actions={
          <Button variant="outline" onClick={() => router.push(`/products/${id}`)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-10 w-40" />
        </div>
      ) : (
        <ProductForm
          defaultValues={product}
          onSubmit={(values) => update.mutate({ id, ...values })}
          submitting={update.isPending}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
