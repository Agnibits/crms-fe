import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  status: z.string().min(1, "Please select a status"),
  priority: z.string().min(1, "Please select a priority"),
  dueDate: z.string().optional().or(z.literal("")),
  reminder: z.boolean().optional().default(false),
  assigneeId: z.string().optional().or(z.literal("")),
});
