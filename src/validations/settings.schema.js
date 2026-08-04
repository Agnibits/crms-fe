import { z } from "zod";

const optionalText = (max, message) =>
  z.string().max(max, message).optional().or(z.literal(""));

/** Coerce "" / NaN to undefined so optional number inputs behave nicely. */
const optionalNumber = (schema) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined || Number.isNaN(value)
        ? undefined
        : Number(value),
    schema.optional()
  );

/* ── Company ──────────────────────────────────────────────────── */
export const companySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(120, "Company name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: optionalText(24, "Phone number is too long"),
  website: z
    .string()
    .url("Enter a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  address: optionalText(400, "Address is too long"),
});

/* ── Email settings ───────────────────────────────────────────── */
export const emailSettingsSchema = z.object({
  provider: z.enum(["smtp", "sendgrid", "ses"], {
    errorMap: () => ({ message: "Please pick an email provider" }),
  }),
  host: z.string().min(1, "Host is required").max(160, "Host is too long"),
  port: z
    .number({ invalid_type_error: "Port must be a number" })
    .int("Port must be a whole number")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535"),
  fromName: z.string().min(1, "Sender name is required").max(80, "Sender name is too long"),
  fromEmail: z.string().min(1, "Sender email is required").email("Enter a valid email address"),
  encryption: z.enum(["tls", "ssl", "none"], {
    errorMap: () => ({ message: "Please pick an encryption method" }),
  }),
});

/* ── SMS settings ─────────────────────────────────────────────── */
// Nepal-first: Sparrow and Aakash are what a company here actually buys, and
// the local telcos sell bulk directly. Twilio and Vonage stay for companies
// already on them, but they no longer lead the list.
export const SMS_PROVIDERS = ["sparrow", "aakash", "ntc", "ncell", "twilio", "vonage", "msg91"];

export const smsSettingsSchema = z.object({
  provider: z.enum(SMS_PROVIDERS, {
    errorMap: () => ({ message: "Please pick an SMS provider" }),
  }),
  senderId: z
    .string()
    .min(3, "Sender ID must be at least 3 characters")
    // Alphanumeric sender IDs are capped at 11 characters by GSM, but Nepali
    // providers also issue numeric shortcodes (Sparrow's 9779…), which are
    // longer. Allowing 16 covers both rather than rejecting a valid shortcode.
    .max(16, "Sender ID can't exceed 16 characters"),
  enabled: z.boolean().optional(),
});

/* ── Tax ──────────────────────────────────────────────────────── */
export const taxSchema = z.object({
  defaultRate: z
    .number({ invalid_type_error: "Rate must be a number" })
    .min(0, "Rate can't be negative")
    .max(100, "Rate can't exceed 100%"),
});

/** A single tax row (name + rate). */
export const taxItemSchema = z.object({
  name: z.string().min(1, "Tax name is required").max(40, "Tax name is too long"),
  rate: z
    .number({ invalid_type_error: "Rate must be a number" })
    .min(0, "Rate can't be negative")
    .max(100, "Rate can't exceed 100%"),
});

/* ── Currency ─────────────────────────────────────────────────── */
export const currencySchema = z.object({
  code: z.enum(["NPR", "INR", "USD", "EUR", "GBP", "AED", "SGD"], {
    errorMap: () => ({ message: "Please pick a currency" }),
  }),
  symbol: z.string().min(1, "Symbol is required").max(4, "Symbol is too long"),
  position: z.enum(["before", "after"], {
    errorMap: () => ({ message: "Pick where the symbol appears" }),
  }),
  decimals: z
    .number({ invalid_type_error: "Decimals must be a number" })
    .int("Decimals must be a whole number")
    .min(0, "Minimum is 0 decimals")
    .max(3, "Maximum is 3 decimals"),
});

/* ── Org structure rows (branches / departments / teams) ─────── */
export const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters").max(80, "Branch name is too long"),
  code: z.string().max(20, "Code is too long").optional().or(z.literal("")),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  addressLine: z.string().max(120, "Address is too long").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(60, "City name is too long"),
  state: z.string().max(60, "State is too long").optional().or(z.literal("")),
  postalCode: z.string().max(20, "Postal code is too long").optional().or(z.literal("")),
  country: z.string().min(1, "Country is required").max(60, "Country name is too long"),
  isPrimary: z.boolean().optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").max(80, "Department name is too long"),
  code: z.string().max(20, "Code is too long").optional().or(z.literal("")),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
  headId: z.string().optional().or(z.literal("")),
});

export const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(80, "Team name is too long"),
  lead: optionalText(80, "Name is too long"),
  members: optionalNumber(
    z
      .number({ invalid_type_error: "Members must be a number" })
      .int("Members must be a whole number")
      .min(0, "Members can't be negative")
      .max(10000, "That's a lot of people — check the number")
  ),
});
