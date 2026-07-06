import { z } from "zod";

/** Super Admin → create a tenant company plus its first ADMIN user. */
export const companySchema = z.object({
  // Company
  name: z.string().min(2, "Company name is required").max(120),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  currency: z
    .string()
    .length(3, "3-letter code, e.g. INR")
    .optional()
    .or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  // First admin of the company
  adminFirstName: z.string().min(1, "First name is required").max(60),
  adminLastName: z.string().min(1, "Last name is required").max(60),
  adminEmail: z.string().min(1, "Admin email is required").email("Enter a valid email"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});
