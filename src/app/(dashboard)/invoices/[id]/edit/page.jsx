"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import InvoiceForm from "@/features/invoices/InvoiceForm";
import { invoiceHooks } from "@/features/invoices/hooks";

/** Draft-only invoice editing — a sent/paid invoice is a financial record. */
export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: invoice, isPending, error, refetch } = invoiceHooks.useDetail(id);
  const update = invoiceHooks.useUpdate({ onSuccess: () => router.push(`/invoices/${id}`) });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!invoice) return <EmptyState title="Invoice not found" />;

  if (invoice.status !== "draft") {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Only draft invoices can be edited"
          description="This invoice has already been sent or paid — it's a financial record now. Void it and create a new one if something is wrong."
          actionLabel="Back to invoice"
          onAction={() => router.push(`/invoices/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${invoice.number}`}
        description="Update the draft before sending it to the customer."
      />
      <InvoiceForm
        lockCustomer
        submitLabel="Save Invoice"
        defaultValues={{
          customerId: invoice.customerId ?? "",
          dueDate: invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : "",
          notes: invoice.notes ?? "",
          items: (invoice.items ?? []).map((it) => ({
            description: it.description ?? "",
            quantity: Number(it.quantity) || 1,
            unit: it.unit ?? "pcs",
            unitPrice: Number(it.unitPrice) || 0,
            taxRate: it.taxRate !== null && it.taxRate !== undefined ? Number(it.taxRate) : "",
          })),
        }}
        onSubmit={(values) => update.mutate({ id, ...values })}
        submitting={update.isPending}
        onCancel={() => router.back()}
      />
    </div>
  );
}
