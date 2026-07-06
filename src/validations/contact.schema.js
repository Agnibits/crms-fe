import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().max(25, "Phone number is too long").optional().or(z.literal("")),
  jobTitle: z.string().max(80, "Job title is too long").optional().or(z.literal("")),
  customerId: z.string().min(1, "Select a customer"),
  city: z.string().max(60).optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
});
