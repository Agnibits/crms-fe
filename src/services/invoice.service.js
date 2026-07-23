"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

/**
 * Invoice CRUD service. status enum cased (void→CANCELLED).
 *
 * The backend returns `invoiceNumber`, a nested `customer` object, and no
 * balance at all — while the list columns and InvoiceDocument read `number`,
 * `customerName` and `balance`. fromBackend derives all three.
 */
const base = createCrudService(ENDPOINTS.invoices);

const inner = makeMapper({
  enums: ["status"],
  // Derived labels (number/customerName/balance) are never written back.
  allow: ["customerId", "orderId", "dueDate", "currency", "status", "discount", "tax", "items", "notes"],
});

const mapper = {
  toBackend: inner.toBackend,
  fromBackend(c) {
    if (!c || typeof c !== "object") return c;
    const total = Number(c.total ?? 0);
    const amountPaid = Number(c.amountPaid ?? 0);
    return {
      ...inner.fromBackend(c),
      number: c.invoiceNumber ?? c.number ?? "",
      customerId: c.customerId ?? c.customer?.id,
      customerName: c.customer?.name ?? c.customerName ?? "",
      // Prisma sends Decimals as strings ("80000"); the UI does arithmetic on these.
      subtotal: Number(c.subtotal ?? 0),
      discount: Number(c.discount ?? 0),
      tax: Number(c.tax ?? 0),
      total,
      amountPaid,
      balance: total - amountPaid,
      items: (c.items ?? []).map((it) => ({
        ...it,
        quantity: Number(it.quantity ?? 0),
        unitPrice: Number(it.unitPrice ?? 0),
        total: Number(it.total ?? 0),
      })),
    };
  },
};

export const invoiceService = {
  ...withMapping(base, mapper),
  // GET /invoices/:id omits line items and payments — only /detail includes them.
  getById: async (id, opts) => mapper.fromBackend(await base.sub(id, "detail", {}, opts)),
  // POST /invoices/:id/send — email the invoice to the customer
  send: (id, payload) => base.action(id, "send", payload),
};
