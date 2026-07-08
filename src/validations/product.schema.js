import { z } from "zod";

/** FormNumber gives NaN when empty — coerce optional counts to 0. */
const optionalCount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number.isNaN(v) ? 0 : Number(v)),
  z.number().int("Must be a whole number").min(0, "Cannot be negative")
);

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(120),
  sku: z.string().min(2, "SKU is required").max(40),
  categoryId: z.string().optional().or(z.literal("")),
  price: z
    .number({ invalid_type_error: "Price is required" })
    .min(0, "Price cannot be negative"),
  cost: z
    .number({ invalid_type_error: "Cost is required" })
    .min(0, "Cost cannot be negative"),
  stock: z
    .number({ invalid_type_error: "Stock is required" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  reservedStock: optionalCount,
  reorderLevel: optionalCount,
  unit: z.string().min(1, "Select a unit"),
  taxRate: z
    .number({ invalid_type_error: "Tax rate is required" })
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%"),
  status: z.string().min(1, "Select a status"),
  description: z.string().max(500, "Keep the description under 500 characters").optional().or(z.literal("")),
});

export const productCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(60),
  description: z.string().max(200).optional().or(z.literal("")),
});
