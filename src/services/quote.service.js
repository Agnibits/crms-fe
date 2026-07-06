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
  fromBackend: inner.fromBackend,
  toBackend(v = {}) {
    const out = inner.toBackend(v);
    if (Array.isArray(out.items)) out.items = out.items.map(sanitizeItem);
    return out;
  },
};

export const quoteService = {
  ...withMapping(base, mapper),
  /** Convert an accepted quote into a sales order: POST /quotes/:id/convert */
  convertToOrder: (id, payload = {}) => base.action(id, "convert", payload),
};
