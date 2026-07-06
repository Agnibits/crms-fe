"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ProductForm from "@/features/products/ProductForm";
import { Button } from "@/components/ui/button";
import { productHooks } from "@/features/products/hooks";

export default function NewProductPage() {
  const router = useRouter();
  const create = productHooks.useCreate({
    onSuccess: () => router.push("/products"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Product"
        description="Add a product to your catalog."
        actions={
          <Button variant="outline" onClick={() => router.push("/products")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />
      <ProductForm
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        submitLabel="Create Product"
      />
    </div>
  );
}
