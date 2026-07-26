"use client";

import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { makeMapper, withMapping } from "./crudMap";

const base = createCrudService(ENDPOINTS.quotes);

// Backend quote-item columns; the builder rides along productName/total.
function sanitizeItem(it = {}) {
  const out = {
    productId: it.productId || undefined,
    description: it.description || it.productName || undefined,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    discount: it.discount,
    taxRate: it.taxRate,
  };
  Object.keys(out).forEach((k) => (out[k] === undefined || out[k] === "") && delete out[k]);
  return out;
}

const inner = makeMapper({
  enums: ["status"],
  allow: ["customerId", "title", "validUntil", "currency", "status", "discount", "tax", "items", "notes"],
});

const mapper = {
  toBackend(v = {}) {
    const out = inner.toBackend(v);
    if (Array.isArray(out.items)) out.items = out.items.map(sanitizeItem);
    return out;
  },
  fromBackend(q) {
    if (!q || typeof q !== "object") return q;
    const total = Number(q.total ?? 0);
    return {
      ...inner.fromBackend(q),
      number: q.quoteNumber ?? q.number ?? "",
      customerId: q.customerId ?? q.customer?.id,
      customerName: q.customer?.name ?? q.customerName ?? "",
      customer: q.customer ?? null,
      subtotal: Number(q.subtotal ?? 0),
      discount: Number(q.discount ?? 0),
      tax: Number(q.tax ?? 0),
      total,
      items: (q.items ?? []).map((it) => ({
        ...it,
        productName: it.product?.name ?? it.description ?? it.productName ?? "",
        quantity: Number(it.quantity ?? 0),
        unit: it.unit ?? "",
        unitPrice: Number(it.unitPrice ?? 0),
        total: Number(it.total ?? 0),
      })),
    };
  },
};

export const quoteService = {
  ...withMapping(base, mapper),
  // GET /quotes/:id omits items + customer — /detail includes them.
  getById: async (id, opts) => mapper.fromBackend(await base.sub(id, "detail", {}, opts)),
  /** Convert an accepted quote into a sales order: POST /quotes/:id/convert */
  convertToOrder: (id, payload = {}) => base.action(id, "convert", payload),
};
