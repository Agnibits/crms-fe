"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, FileText, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
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
import { ORDER_STATUSES } from "@/constants/options";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const FLOW = ORDER_STATUSES.filter((s) => s.value !== "cancelled");

function StatusFlow({ order, patch }) {
  const currentIndex = FLOW.findIndex((s) => s.value === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="space-y-3">
      {FLOW.map((step, index) => {
        const done = !cancelled && currentIndex >= index;
        const isCurrent = !cancelled && currentIndex === index;
        return (
          <button
            key={step.value}
            type="button"
            disabled={patch.isPending || cancelled}
            onClick={() => patch.mutate({ id: order.id, status: step.value })}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              done ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
              isCurrent && "ring-1 ring-primary/50",
              (patch.isPending || cancelled) && "cursor-not-allowed opacity-70"
            )}
            aria-label={`Set status to ${step.label}`}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>
                {step.label}
              </p>
            </div>
            {isCurrent && (
              <span className="text-xs font-medium text-primary">Current</span>
            )}
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
          disabled={patch.isPending || order.status === "delivered"}
          onClick={() => patch.mutate({ id: order.id, status: "cancelled" })}
        >
          {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancel order
        </Button>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: order, isPending, error, refetch } = orderHooks.useDetail(id);
  const patch = orderHooks.usePatch();

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.number}
        description={`Order for ${order.customerName} · ${formatCurrency(order.total)}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
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
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
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
                <p className="mt-1 text-sm font-medium">{order.customerName}</p>
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
                      <FileText className="h-3.5 w-3.5" /> View quote
                    </Link>
                  </Button>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                )}
              </div>
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
            <StatusFlow order={order} patch={patch} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
