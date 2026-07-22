"use client";

import { Building2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import { INVOICE_STATUSES, findOption } from "@/constants/options";
import { absoluteUploadUrl } from "@/services/normalize";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const STAMP_STYLES = {
  paid: "border-emerald-500/60 text-emerald-600 dark:text-emerald-400",
  partially_paid: "border-amber-500/60 text-amber-600 dark:text-amber-400",
  overdue: "border-red-500/60 text-red-600 dark:text-red-400",
  sent: "border-blue-500/60 text-blue-600 dark:text-blue-400",
  draft: "border-muted-foreground/50 text-muted-foreground",
  void: "border-muted-foreground/50 text-muted-foreground",
};

/**
 * Print-friendly invoice document. Wrap in a Card for on-screen preview;
 * `window.print()` prints only this area (see the print CSS below).
 * `company` is the ISSUING (tenant) company — the letterhead is theirs,
 * never the platform's.
 */
export default function InvoiceDocument({ invoice, company }) {
  if (!invoice) return null;

  const statusLabel = findOption(INVOICE_STATUSES, invoice.status)?.label ?? invoice.status;
  const sellerAddress = [company?.addressLine, company?.city, company?.country]
    .filter(Boolean)
    .join(", ");
  const sellerContact = [company?.email, company?.phone].filter(Boolean).join(" · ");
  const logoUrl = absoluteUploadUrl(company?.logoUrl);

  return (
    <div id="invoice-print-area" className="relative bg-card p-6 sm:p-10">
      {/* Print-only isolation: hide everything else when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: absolute; inset: 0 auto auto 0; width: 100%;
            padding: 24px; background: #fff; color: #000;
          }
        }
      `}</style>

      {/* Status stamp — below the header block so it never covers the title */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-6 top-28 rotate-6 select-none rounded-md border-2 px-3 py-1 text-sm font-bold uppercase tracking-[0.2em] opacity-70 sm:right-10 sm:top-32",
          STAMP_STYLES[invoice.status] ?? STAMP_STYLES.draft
        )}
      >
        {statusLabel}
      </div>

      {/* Letterhead: the issuing (tenant) company */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${company?.name ?? "Company"} logo`}
              className="h-11 w-11 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-lg font-bold tracking-tight">{company?.name ?? "—"}</p>
            {sellerAddress && <p className="text-xs text-muted-foreground">{sellerAddress}</p>}
            {sellerContact && <p className="text-xs text-muted-foreground">{sellerContact}</p>}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xl font-semibold tracking-tight">INVOICE</p>
          <p className="mt-0.5 font-medium tabular-nums">{invoice.number}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Issued: {formatDate(invoice.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Bill to */}
      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bill To
          </p>
          <p className="mt-1.5 font-semibold">{invoice.customerName || "—"}</p>
          <p className="text-sm text-muted-foreground">Customer ID: {invoice.customerId || "—"}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <div className="mt-1.5">
            <StatusBadge value={invoice.status} options={INVOICE_STATUSES} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 text-right font-medium">Qty</th>
              <th className="px-4 py-2.5 text-right font-medium">Unit Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Tax %</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item, i) => (
              <tr key={item.id ?? i} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">
                  {item.description || item.product?.name || "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {Number(item.taxRate ?? 0) > 0 ? `${Number(item.taxRate)}%` : "—"}
                </td>
                {/* Line amount is pre-tax; the tax summary lives in the totals block. */}
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(
                    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) -
                      (Number(item.discount) || 0),
                    invoice.currency
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="tabular-nums">{formatCurrency(invoice.tax, invoice.currency)}</dd>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(invoice.total, invoice.currency)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Amount Paid</dt>
            <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(invoice.amountPaid, invoice.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 font-semibold">
            <dt>Balance Due</dt>
            <dd className={cn("tabular-nums", invoice.balance > 0 && "text-red-600 dark:text-red-400")}>
              {formatCurrency(invoice.balance, invoice.currency)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
        <p>
          Payment due by <span className="font-medium">{formatDate(invoice.dueDate)}</span>. Thank
          you for your business!
        </p>
        {(company?.name || company?.website) && (
          <p className="mt-1">
            {[company?.name, company?.website].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
