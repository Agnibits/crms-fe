"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Payment CRUD service. method enum cased (bank_transfer/cheque→BANK);
 * the form's "paidAt" has no create column.
 */
const base = createCrudService(ENDPOINTS.payments);
// Drops paidAt/number/invoiceNumber/customerId/customerName/status the dialog rides along.
const inner = makeMapper({
  enums: ["method"],
  allow: ["invoiceId", "amount", "method", "currency", "reference", "notes"],
});

const mapper = {
  toBackend: inner.toBackend,
  fromBackend(p) {
    if (!p || typeof p !== "object") return p;
    return {
      ...inner.fromBackend(p),
      number: p.paymentNumber ?? p.number ?? "",
      invoiceId: p.invoiceId ?? p.invoice?.id,
      invoiceNumber: p.invoice?.invoiceNumber ?? "",
      customerId: p.invoice?.customerId ?? p.customerId,
      customerName: p.invoice?.customer?.name ?? "",
      amount: Number(p.amount ?? 0),
    };
  },
};

export const paymentService = withMapping(base, mapper);
