"use client";

import StatusBadge from "@/components/common/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { QUOTE_STATUSES } from "@/constants/options";
import { formatCurrency, formatDate } from "@/utils/format";

export const QUOTE_COMPANY = {
  name: "AgniBits Technologies",
  email: "hello@agnibits.com",
  phone: "+91 9876543210",
  website: "https://agnibits.com",
  address: "4th Floor, Tech Park One, Pune, India",
  gstin: "27ABCDE1234F1Z5",
};

/**
 * Print-friendly quote document: company + customer header,
 * line-item table and subtotal / discount / tax / total footer.
 *   <QuoteDocument quote={quote} />
 */
export default function QuoteDocument({ quote }) {
  if (!quote) return null;
  const items = quote.items ?? [];

  return (
    <div className="rounded-xl bg-background p-6 text-sm sm:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
              A
            </span>
            <div>
              <p className="text-base font-semibold leading-tight">{QUOTE_COMPANY.name}</p>
              <p className="text-xs text-muted-foreground">{QUOTE_COMPANY.website}</p>
            </div>
          </div>
          <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
            <p>{QUOTE_COMPANY.address}</p>
            <p>{QUOTE_COMPANY.email} · {QUOTE_COMPANY.phone}</p>
            <p>GSTIN: {QUOTE_COMPANY.gstin}</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xl font-semibold tracking-tight">QUOTATION</p>
          <p className="mt-1 font-medium">{quote.number || "—"}</p>
          <div className="mt-2 flex sm:justify-end">
            <StatusBadge value={quote.status} options={QUOTE_STATUSES} />
          </div>
          <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
            <p>Issued: {formatDate(quote.createdAt)}</p>
            <p>Valid until: {formatDate(quote.validUntil)}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Bill to */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote for</p>
        <p className="mt-1 text-base font-semibold">{quote.customerName || "—"}</p>
        <p className="text-xs text-muted-foreground">Customer ID: {quote.customerId || "—"}</p>
      </div>

      {/* Line items */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              <th className="py-2 pr-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.productId}-${index}`} className="border-b last:border-b-0">
                <td className="py-2.5 pr-2 text-muted-foreground">{index + 1}</td>
                <td className="py-2.5 pr-2 font-medium">{item.productName || item.productId}</td>
                <td className="py-2.5 pr-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2.5 pr-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">
                  {formatCurrency(item.total ?? item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums text-foreground">{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular-nums text-foreground">
              {quote.discount ? `− ${formatCurrency(quote.discount)}` : formatCurrency(0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums text-foreground">{formatCurrency(quote.tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="mt-8 rounded-lg bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm">{quote.notes}</p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Thank you for considering {QUOTE_COMPANY.name}. This quotation is valid until {formatDate(quote.validUntil)}.
      </p>
    </div>
  );
}
