import { z } from "zod";

const emptyToUndefined = (v) =>
  v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))
    ? undefined
    : Number(v);

export const dealSchema = z.object({
  name: z.string().min(2, "Deal name must be at least 2 characters"),
  customerName: z.string().min(1, "Customer is required"),
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
  probability: z.preprocess(
    emptyToUndefined,
    z
      .number({
        required_error: "Probability is required",
        invalid_type_error: "Enter a valid probability",
      })
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100")
  ),
  expectedCloseDate: z.string().min(1, "Expected close date is required"),
  ownerId: z.string().optional().or(z.literal("")),
});
