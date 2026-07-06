import { z } from "zod";
import { PAYMENT_METHODS } from "@/constants/options";

const methodValues = PAYMENT_METHODS.map((m) => m.value);

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Please select an invoice"),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Enter a valid amount",
    })
    .positive("Amount must be greater than zero"),
  method: z.enum(methodValues, {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  reference: z.string().max(80, "Reference is too long").optional().or(z.literal("")),
  paidAt: z
    .string()
    .min(1, "Payment date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
});
