"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2, Printer, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import QuoteDocument from "@/features/quotes/QuoteDocument";
import { useQuotePdf } from "@/features/quotes/useQuotePdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quoteHooks } from "@/features/quotes/hooks";
import { QUOTE_STATUSES } from "@/constants/options";
import { formatCurrency, formatDate } from "@/utils/format";

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: quote, isPending, error, refetch } = quoteHooks.useDetail(id);
  const patch = quoteHooks.usePatch();
  const convert = quoteHooks.useAction({
    successMessage: "Quote converted to order",
    onSuccess: () => router.push("/orders"),
  });
  const { downloadPdf, downloading } = useQuotePdf();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quote" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-[480px] w-full rounded-xl xl:col-span-2" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.number}
        description={`Quote for ${quote.customerName} · ${formatCurrency(quote.total)}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/quotes")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Document preview */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" /> Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <QuoteDocument quote={quote} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => downloadPdf(quote)}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={convert.isPending || quote.status === "declined" || quote.status === "expired"}
                onClick={() => convert.mutate({ id, action: "convert-to-order" })}
              >
                {convert.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Convert to Order
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="quote-status" className="text-xs text-muted-foreground">
                Update quote status
              </Label>
              <Select
                value={quote.status}
                onValueChange={(status) => patch.mutate({ id, status })}
                disabled={patch.isPending}
              >
                <SelectTrigger id="quote-status" className="w-full">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items</span>
                <span className="tabular-nums text-foreground">{quote.items?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums text-foreground">{formatCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="tabular-nums text-foreground">− {formatCurrency(quote.discount || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums text-foreground">{formatCurrency(quote.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(quote.total)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-muted-foreground">
                <span>Valid until</span>
                <span className="text-foreground">{formatDate(quote.validUntil)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Created</span>
                <span className="text-foreground">{formatDate(quote.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
