"use client";
import { createCrudHooks } from "@/hooks/useCrud";
import { productService } from "@/services/product.service";
import { productCategoryService } from "@/services/product-category.service";
import { QUERY_KEYS } from "@/constants/app";

export const productHooks = createCrudHooks({
  key: QUERY_KEYS.products,
  service: productService,
  label: "Product",
});

export const productCategoryHooks = createCrudHooks({
  key: QUERY_KEYS.productCategories,
  service: productCategoryService,
  label: "Category",
});
