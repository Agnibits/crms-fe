"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceForm from "@/features/invoices/InvoiceForm";
import { invoiceHooks } from "@/features/invoices/hooks";

/**
 * Standalone invoice creation. Supports prefill via query params so a won
 * deal can hand off straight into billing:
 *   /invoices/new?customerId=…&amount=150000&description=TechNova deal
 */
function NewInvoiceInner() {
  const router = useRouter();
  const params = useSearchParams();
  const create = invoiceHooks.useCreate({
    onSuccess: (invoice) => router.push(invoice?.id ? `/invoices/${invoice.id}` : "/invoices"),
  });

  const prefillCustomer = params.get("customerId") ?? "";
  const prefillAmount = params.get("amount");
  const prefillDescription = params.get("description");

  const defaultValues = {
    customerId: prefillCustomer,
    ...(prefillAmount || prefillDescription
      ? {
          items: [
            {
              description: prefillDescription ?? "",
              quantity: 1,
              unitPrice: prefillAmount ?? "",
              taxRate: "",
            },
          ],
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Invoice" description="Bill a customer and track the collection." />
      <InvoiceForm
        defaultValues={defaultValues}
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewInvoiceInner />
    </Suspense>
  );
}
