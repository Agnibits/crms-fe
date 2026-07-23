"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  HandCoins,
  Loader2,
  Mail,
  Pencil,
  Printer,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import InvoiceDocument from "@/features/invoices/InvoiceDocument";
import { useInvoicePdf } from "@/features/invoices/useInvoicePdf";
import { invoiceHooks } from "@/features/invoices/hooks";
import RecordPaymentDialog from "@/features/payments/RecordPaymentDialog";
import { INVOICE_STATUSES, PAYMENT_METHODS, findOption } from "@/constants/options";
import { useMyCompany } from "@/hooks/useMyCompany";
import { formatCurrency, formatDate } from "@/utils/format";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);

  // /invoices/:id/detail carries customer + items + payments in one response.
  const { data: invoice, isPending, error, refetch } = invoiceHooks.useDetail(id);
  const { company } = useMyCompany();
  const { downloadPdf, isGenerating } = useInvoicePdf();

  const sendInvoice = invoiceHooks.useAction({
    successMessage: "Invoice emailed to customer",
  });

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const payments = invoice?.payments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isPending ? (
            "Invoice"
          ) : (
            <span className="inline-flex flex-wrap items-center gap-2">
              {invoice?.number}
              <StatusBadge value={invoice?.status} options={INVOICE_STATUSES} />
            </span>
          )
        }
        description={
          isPending
            ? undefined
            : `${invoice?.customerName ?? ""} · Due ${formatDate(invoice?.dueDate)}`
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/invoices")}>
              <ArrowLeft /> Back
            </Button>
            {invoice?.status === "draft" && (
              <Button variant="outline" onClick={() => router.push(`/invoices/${id}/edit`)}>
                <Pencil /> Edit
              </Button>
            )}
            <Button
              variant="outline"
              disabled={isPending || isGenerating}
              onClick={() => downloadPdf(invoice)}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Download />}
              Download PDF
            </Button>
            <Button variant="outline" disabled={isPending} onClick={() => window.print()}>
              <Printer /> Print
            </Button>
            <Button
              variant="outline"
              disabled={isPending || sendInvoice.isPending}
              onClick={() => sendInvoice.mutate({ id, action: "send" })}
            >
              {sendInvoice.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
              Email Invoice
            </Button>
            <Button
              disabled={isPending || (invoice?.balance ?? 0) <= 0}
              onClick={() => setPaymentOpen(true)}
            >
              <HandCoins /> Record Payment
            </Button>
          </>
        }
      />

      <Tabs defaultValue="document">
        <TabsList>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Document preview */}
        <TabsContent value="document">
          <Card className="overflow-hidden">
            {isPending ? (
              <CardContent className="space-y-4 p-6 sm:p-10">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-12 w-32" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-48 w-full" />
                <div className="flex justify-end">
                  <Skeleton className="h-32 w-64" />
                </div>
              </CardContent>
            ) : (
              <InvoiceDocument invoice={invoice} company={company} />
            )}
          </Card>
        </TabsContent>

        {/* Payment history */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              {isPending ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={HandCoins}
                  title="No payments yet"
                  description="Payments recorded against this invoice will appear here."
                  actionLabel={(invoice?.balance ?? 0) > 0 ? "Record Payment" : undefined}
                  onAction={
                    (invoice?.balance ?? 0) > 0 ? () => setPaymentOpen(true) : undefined
                  }
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Payment #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium tabular-nums">
                          {payment.paymentNumber ?? payment.number ?? "—"}
                        </TableCell>
                        <TableCell>
                          {findOption(PAYMENT_METHODS, String(payment.method ?? "").toLowerCase())
                            ?.label ??
                            payment.method ??
                            "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.reference || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{formatDate(payment.paidAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoiceId={id}
      />
    </div>
  );
}
