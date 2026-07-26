"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import ProductForm from "@/features/products/ProductForm";
import { Button } from "@/components/ui/button";
import { productHooks, useUploadProductImage } from "@/features/products/hooks";

export default function NewProductPage() {
  const router = useRouter();
  const create = productHooks.useCreate();
  const uploadImage = useUploadProductImage();
  const submitting = create.isPending || uploadImage.isPending;

  // Create the product, then upload the picked image against its new id.
  const handleSubmit = async (values, imageFile) => {
    const product = await create.mutateAsync(values);
    if (imageFile && product?.id) {
      try {
        await uploadImage.mutateAsync({ id: product.id, file: imageFile });
      } catch {
        toast.error("Product created, but the image didn't upload. Add it from the product page.");
      }
    }
    router.push("/products");
  };

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
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create Product"
      />
    </div>
  );
}
