"use client";

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
  "stock", "unit", "categoryId", "isActive",
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
    };
  },
};

export const productService = withMapping(base, mapper);
