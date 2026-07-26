"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Payment CRUD service. method enum cased (bank_transfer/cheque→BANK);
 * the form's "paidAt" has no create column.
 */
const base = createCrudService(ENDPOINTS.payments);

// Writes: drop number/invoiceNumber/customerId/customerName/status the dialog
// rides along; keep paidAt so a back-dated payment date reaches the backend.
const inner = makeMapper({
  enums: ["method"],
  allow: ["invoiceId", "amount", "method", "currency", "reference", "notes", "paidAt"],
});

const mapper = {
  toBackend: inner.toBackend,
  // Reads: the list/detail carry paymentNumber + a nested invoice{customer}.
  // Flatten those into the flat shape the table and receipt read, and coerce the
  // Decimal-string amount to a real number (otherwise the summary totals, which
  // sum amounts, string-concatenate into NaN and render as Rs 0.00).
  fromBackend(p) {
    if (!p || typeof p !== "object") return p;
    return {
      ...inner.fromBackend(p),
      number: p.paymentNumber ?? p.number ?? "",
      amount: Number(p.amount ?? 0),
      invoiceId: p.invoiceId ?? p.invoice?.id ?? null,
      invoiceNumber: p.invoice?.invoiceNumber ?? p.invoiceNumber ?? "",
      customerName: p.invoice?.customer?.name ?? p.customerName ?? "",
    };
  },
};

export const paymentService = withMapping(base, mapper);
