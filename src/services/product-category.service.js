"use client";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";
import { withMapping } from "./crudMap";

/** Product categories. Surface the backend `_count.products` as `productCount`. */
const base = createCrudService(ENDPOINTS.productCategories);

export const productCategoryService = withMapping(base, {
  fromBackend(c) {
    if (!c || typeof c !== "object") return c;
    return { ...c, productCount: c._count?.products ?? c.productCount ?? 0 };
  },
});
