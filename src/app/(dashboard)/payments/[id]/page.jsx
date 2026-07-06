"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Receipt } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentHooks } from "@/features/payments/hooks";
import { PAYMENT_METHODS, findOption } from "@/constants/options";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

function ReceiptRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: payment, isPending, error, refetch } = paymentHooks.useDetail(id);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payment Receipt" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Receipt"
        description={isPending ? undefined : payment?.number}
        actions={
          <Button variant="ghost" onClick={() => router.push("/payments")}>
            <ArrowLeft /> Back to Payments
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardContent className="p-6 sm:p-8">
            {isPending ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-px w-full" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Receipt header */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <BadgeCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Payment received</p>
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(payment?.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(payment?.paidAt)}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Receipt details */}
                <dl className="divide-y">
                  <ReceiptRow label="Receipt #">
                    <span className="tabular-nums">{payment?.number ?? "—"}</span>
                  </ReceiptRow>
                  <ReceiptRow label="Customer">{payment?.customerName ?? "—"}</ReceiptRow>
                  <ReceiptRow label="Invoice">
                    {payment?.invoiceId ? (
                      <Link
                        href={`/invoices/${payment.invoiceId}`}
                        className="tabular-nums text-primary hover:underline"
                      >
                        {payment.invoiceNumber ?? payment.invoiceId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </ReceiptRow>
                  <ReceiptRow label="Method">
                    {findOption(PAYMENT_METHODS, payment?.method)?.label ??
                      payment?.method ??
                      "—"}
                  </ReceiptRow>
                  <ReceiptRow label="Reference">
                    <span className="tabular-nums">{payment?.reference || "—"}</span>
                  </ReceiptRow>
                  <ReceiptRow label="Payment Date">{formatDate(payment?.paidAt)}</ReceiptRow>
                  <ReceiptRow label="Status">
                    <StatusBadge
                      value={payment?.status ?? "completed"}
                      options={[{ value: "completed", label: "Completed", color: "green" }]}
                    />
                  </ReceiptRow>
                </dl>

                <Separator className="my-6" />

                <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> AgniBits CRM
                  </span>
                  <p>This receipt was generated automatically and is valid without signature.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
