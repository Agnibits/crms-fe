"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createCrudHooks } from "@/hooks/useCrud";
import { productService } from "@/services/product.service";
import { productCategoryService } from "@/services/product-category.service";
import { toastError } from "@/services/api";
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

/** Upload / replace a product's image. */
export function useUploadProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => productService.uploadImage(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success("Product image updated");
    },
    onError: (e) => toastError(e, "Image upload failed"),
  });
}

/** Grouped business units for the unit dropdown (cached — rarely change). */
export function useProductUnits() {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, "units"],
    queryFn: ({ signal }) => productService.getUnits({ signal }),
    staleTime: 60 * 60 * 1000,
  });
}
