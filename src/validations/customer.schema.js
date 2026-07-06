import { z } from "zod";

/** Optional numeric field fed by <FormNumber> (valueAsNumber → NaN when empty). */
const optionalNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined || Number.isNaN(value)
      ? undefined
      : Number(value),
  z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Must be zero or more")
    .optional()
);

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(120, "Company name is too long"),
  contactName: z.string().max(80, "Contact name is too long").optional().or(z.literal("")),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().max(25, "Phone number is too long").optional().or(z.literal("")),
  website: z
    .string()
    .url("Enter a valid URL, e.g. https://example.com")
    .optional()
    .or(z.literal("")),
  industry: z.string().max(60, "Industry is too long").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "prospect", "churned"], {
    errorMap: () => ({ message: "Select a status" }),
  }),
  city: z.string().max(60).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  address: z.string().max(160, "Address is too long").optional().or(z.literal("")),
  annualRevenue: optionalNumber,
  employees: optionalNumber,
  notes: z.string().max(1000, "Notes are too long").optional().or(z.literal("")),
});
