import { z } from "zod";

/** Turns "", null and NaN (from valueAsNumber on empty inputs) into undefined. */
const emptyToUndefined = (v) =>
  v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))
    ? undefined
    : Number(v);

export const leadSchema = z
  .object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  // Not every lead has a company (B2C / individual leads).
  company: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  stage: z.string().min(1, "Stage is required"),
  source: z.string().min(1, "Source is required"),
  value: z.preprocess(
    emptyToUndefined,
    z
      .number({ invalid_type_error: "Enter a valid amount" })
      .min(0, "Value cannot be negative")
      .optional()
  ),
  score: z.preprocess(
    emptyToUndefined,
    z
      .number({ invalid_type_error: "Enter a valid score" })
      .min(0, "Score must be between 0 and 100")
      .max(100, "Score must be between 0 and 100")
      .optional()
  ),
  ownerId: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  })
  // A lead is unreachable without at least one contact channel.
  .refine((d) => Boolean(d.email?.trim() || d.phone?.trim()), {
    message: "Provide an email or a phone number",
    path: ["email"],
  });
