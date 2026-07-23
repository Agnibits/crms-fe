import { z } from "zod";

const emptyToUndefined = (v) =>
  v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))
    ? undefined
    : Number(v);

export const opportunitySchema = z.object({
  name: z.string().min(2, "Opportunity name must be at least 2 characters"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().optional().or(z.literal("")),
  stage: z.string().min(1, "Stage is required"),
  amount: z.preprocess(
    emptyToUndefined,
    z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Enter a valid amount",
      })
      .min(0, "Amount cannot be negative")
  ),
  // Derived from the chosen stage (backend syncs it); never typed by hand.
  probability: z.preprocess(
    emptyToUndefined,
    z.number().min(0).max(100).optional()
  ),
  expectedCloseDate: z.string().min(1, "Expected close date is required"),
  ownerId: z.string().optional().or(z.literal("")),
});
