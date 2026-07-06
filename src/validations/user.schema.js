import { z } from "zod";
import { ALL_ROLES } from "@/constants/roles";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  role: z.enum(ALL_ROLES, {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  phone: z.string().max(24, "Phone number is too long").optional().or(z.literal("")),
  department: z.string().max(60, "Department name is too long").optional().or(z.literal("")),
});
