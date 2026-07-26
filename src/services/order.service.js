"use client";

import { api, unwrap } from "./api";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

const base = createCrudService(ENDPOINTS.orders);

const inner = makeMapper({
  enums: ["status"],
  allow: ["customerId", "quoteId", "currency", "status", "discount", "tax", "items"],
});

const mapper = {
  toBackend: inner.toBackend,
  fromBackend(o) {
    if (!o || typeof o !== "object") return o;
    return {
      ...inner.fromBackend(o),
      number: o.orderNumber ?? o.number ?? "",
      customerId: o.customerId ?? o.customer?.id,
      customerName: o.customer?.name ?? o.customerName ?? "",
      customer: o.customer ?? null,
      quoteNumber: o.quote?.quoteNumber ?? o.quoteNumber,
      subtotal: Number(o.subtotal ?? 0),
      discount: Number(o.discount ?? 0),
      tax: Number(o.tax ?? 0),
      total: Number(o.total ?? 0),
      items: (o.items ?? []).map((it) => ({
        ...it,
        productName: it.product?.name ?? it.description ?? it.productName ?? "",
        quantity: Number(it.quantity ?? 0),
        unit: it.unit ?? "",
        unitPrice: Number(it.unitPrice ?? 0),
        total: Number(it.total ?? 0),
      })),
      // Invoices billed from this order (only present on /detail).
      invoices: (o.invoices ?? []).map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber ?? inv.number ?? "",
        status: String(inv.status ?? "").toLowerCase(),
        total: Number(inv.total ?? 0),
        createdAt: inv.createdAt,
      })),
    };
  },
};

export const orderService = {
  ...withMapping(base, mapper),
  // GET /orders/:id omits items + customer — /detail includes them.
  getById: async (id, opts) => mapper.fromBackend(await base.sub(id, "detail", {}, opts)),
  /** Move an order along its lifecycle: PATCH /orders/:id/status (enum is UPPER). */
  updateStatus: async (id, status) =>
    mapper.fromBackend(
      unwrap(
        await api.patch(`${ENDPOINTS.orders}/${id}/status`, {
          status: String(status).toUpperCase(),
        })
      )
    ),
  /** Bill an order — creates a draft invoice: POST /orders/:id/invoice */
  generateInvoice: async (id, payload = {}) =>
    unwrap(await api.post(`${ENDPOINTS.orders}/${id}/invoice`, payload)),
};
