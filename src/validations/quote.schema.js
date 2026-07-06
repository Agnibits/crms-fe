import { z } from "zod";

export const quoteItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  productName: z.string().optional().or(z.literal("")),
  quantity: z
    .number({ invalid_type_error: "Qty is required" })
    .int("Qty must be a whole number")
    .min(1, "Qty must be at least 1"),
  unitPrice: z
    .number({ invalid_type_error: "Unit price is required" })
    .min(0, "Unit price cannot be negative"),
  taxRate: z.number().optional(),
});

export const quoteSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  items: z.array(quoteItemSchema).min(1, "Add at least one line item"),
  discount: z
    .number({ invalid_type_error: "Enter a discount amount" })
    .min(0, "Discount cannot be negative"),
  tax: z
    .number({ invalid_type_error: "Enter a tax amount" })
    .min(0, "Tax cannot be negative"),
  validUntil: z.string().min(1, "Choose a validity date"),
  notes: z.string().max(500, "Keep notes under 500 characters").optional().or(z.literal("")),
});
