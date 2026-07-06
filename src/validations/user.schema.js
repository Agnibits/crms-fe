import { z } from "zod";
import { ASSIGNABLE_ROLE_VALUES, SUPER_ADMIN_ROLE } from "@/constants/roles";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  // Required on create (backend needs it); left empty / hidden when editing.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .optional()
    .or(z.literal("")),
  // The 7 assignable roles; SUPER_ADMIN accepted only so an existing super
  // admin record validates — it is never offered in the picker.
  role: z.enum([...ASSIGNABLE_ROLE_VALUES, SUPER_ADMIN_ROLE], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  phone: z.string().max(24, "Phone number is too long").optional().or(z.literal("")),
  department: z.string().max(60, "Department name is too long").optional().or(z.literal("")),
});
