"use client";

import { api, unwrap } from "./api";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { withMapping } from "./crudMap";

/**
 * Product CRUD service. price↔sellingPrice, cost↔costPrice, and the form's
 * status string maps to the backend `isActive` boolean.
 */
const base = createCrudService(ENDPOINTS.products);

// Backend Product columns — drops the derived "categoryName" label etc.
const ALLOW = new Set([
  "sku", "name", "description", "costPrice", "sellingPrice", "taxRate",
  "stock", "reservedStock", "reorderLevel", "unit", "categoryId", "isActive",
]);

const mapper = {
  toBackend(v = {}) {
    const out = { ...v };
    if ("price" in out) { out.sellingPrice = out.price; delete out.price; }
    if ("cost" in out) { out.costPrice = out.cost; delete out.cost; }
    if ("status" in out) { out.isActive = out.status !== "inactive"; delete out.status; }
    for (const k of Object.keys(out)) {
      if (!ALLOW.has(k) || out[k] === undefined || out[k] === "") delete out[k];
    }
    return out;
  },
  fromBackend(p) {
    if (!p || typeof p !== "object") return p;
    return {
      ...p,
      price: p.sellingPrice ?? p.price,
      cost: p.costPrice ?? p.cost,
      status: p.isActive === false ? "inactive" : "active",
      // Category comes back as a resolved { id, name } object.
      categoryName: p.category?.name ?? p.categoryName ?? "",
    };
  },
};

export const productService = {
  ...withMapping(base, mapper),
  /** Business units (Nepal), grouped: [{ value, label, group }]. */
  getUnits: async ({ signal } = {}) =>
    unwrap(await api.get(`${ENDPOINTS.products}/units`, { signal })) || [],
  /** Upload a product image (multipart, field "image") → sets imageUrl. */
  uploadImage: async (id, file) => {
    const fd = new FormData();
    fd.append("image", file);
    return mapper.fromBackend(
      unwrap(
        await api.post(`${ENDPOINTS.products}/${id}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      )
    );
  },
};
