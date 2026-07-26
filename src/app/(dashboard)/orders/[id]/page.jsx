"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Ban, Check, FileText, Loader2, Receipt } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderHooks } from "@/features/orders/hooks";
import { orderService } from "@/services/order.service";
import { toastError } from "@/services/api";
import { ORDER_STATUSES, INVOICE_STATUSES } from "@/constants/options";
import { QUERY_KEYS } from "@/constants/app";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

// Fulfilment steps in order (cancelled is a side exit, not a step).
const FLOW = ORDER_STATUSES.filter((s) => s.value !== "cancelled");

function StatusFlow({ order, statusMut }) {
  const currentIndex = FLOW.findIndex((s) => s.value === order.status);
  const cancelled = order.status === "cancelled";
  const busy = statusMut.isPending;

  return (
    <div className="space-y-3">
      {FLOW.map((step, index) => {
        const done = !cancelled && currentIndex >= index;
        const isCurrent = !cancelled && currentIndex === index;
        return (
          <button
            key={step.value}
            type="button"
            disabled={busy || cancelled}
            onClick={() => statusMut.mutate(step.value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              done ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
              isCurrent && "ring-1 ring-primary/50",
              (busy || cancelled) && "cursor-not-allowed opacity-70"
            )}
            aria-label={`Set status to ${step.label}`}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>
                {step.label}
              </p>
            </div>
            {isCurrent && <span className="text-xs font-medium text-primary">Current</span>}
          </button>
        );
      })}

      <Separator />
      {cancelled ? (
        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
          <Ban className="h-4 w-4" /> This order was cancelled.
        </p>
      ) : (
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          disabled={busy || order.status === "completed"}
          onClick={() => statusMut.mutate("cancelled")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancel order
        </Button>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmReinvoice, setConfirmReinvoice] = useState(false);
  const { data: order, isPending, error, refetch } = orderHooks.useDetail(id);

  // Status transitions go through the dedicated /status endpoint (the generic
  // update doesn't accept status), which enforces valid transitions.
  const statusMut = useMutation({
    mutationFn: (status) => orderService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders }),
    onError: (e) => toastError(e, "Couldn't update the order status"),
  });
  const invoiceMut = useMutation({
    mutationFn: () => orderService.generateInvoice(id),
    onSuccess: (invoice) => {
      toast.success("Invoice created from this order");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      router.push(invoice?.id ? `/invoices/${invoice.id}` : "/invoices");
    },
    onError: (e) => toastError(e, "Failed to generate invoice"),
  });

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-xl xl:col-span-2" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const items = order.items ?? [];
  const invoices = order.invoices ?? [];
  // An order can be billed once it's confirmed (not a draft or cancelled).
  const canInvoice = ["confirmed", "processing", "completed"].includes(order.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.number || "Order"}
        description={`Order for ${order.customerName || "—"} · ${formatCurrency(order.total)}`}
        actions={
          <>
            {canInvoice && (
              <Button
                onClick={() =>
                  invoices.length > 0 ? setConfirmReinvoice(true) : invoiceMut.mutate()
                }
                disabled={invoiceMut.isPending}
              >
                {invoiceMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Generate Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/orders")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Line items + totals */}
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">Line items</CardTitle>
              <StatusBadge value={order.status} options={ORDER_STATUSES} />
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <EmptyState title="No line items" className="border-0" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell className="font-medium">
                          {item.productName || item.productId}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(item.total ?? item.quantity * item.unitPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex justify-end border-t p-4">
                <div className="w-full max-w-xs space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums text-foreground">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  {order.discount ? (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Discount</span>
                      <span className="tabular-nums text-foreground">
                        − {formatCurrency(order.discount)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="tabular-nums text-foreground">{formatCurrency(order.tax)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order meta */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Order information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="mt-1 text-sm font-medium">{order.customerName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Linked quote</p>
                {order.quoteId ? (
                  <Button asChild variant="link" className="mt-0.5 h-auto p-0 text-sm">
                    <Link href={`/quotes/${order.quoteId}`}>
                      <FileText className="h-3.5 w-3.5" /> {order.quoteNumber || "View quote"}
                    </Link>
                  </Button>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoices billed from this order — closes the order ↔ invoice loop */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Billing</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {canInvoice
                    ? "No invoice yet. Use “Generate Invoice” to bill this order."
                    : "No invoice yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {inv.number || "Invoice"}
                      </span>
                      <span className="flex items-center gap-3">
                        <StatusBadge value={inv.status} options={INVOICE_STATUSES} />
                        <span className="text-sm tabular-nums">{formatCurrency(inv.total)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status management */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click a step to move the order along its fulfilment flow.
            </p>
          </CardHeader>
          <CardContent>
            <StatusFlow order={order} statusMut={statusMut} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReinvoice}
        onOpenChange={setConfirmReinvoice}
        title="Bill this order again?"
        description={`This order already has ${invoices.length} invoice${
          invoices.length === 1 ? "" : "s"
        }. Only create another if you're splitting the billing — otherwise you'll double-bill the customer.`}
        confirmLabel="Create another invoice"
        loading={invoiceMut.isPending}
        onConfirm={() => invoiceMut.mutate(undefined, { onSuccess: () => setConfirmReinvoice(false) })}
      />
    </div>
  );
}
