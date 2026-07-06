import { z } from "zod";

export const activitySchema = z.object({
  type: z.string().min(1, "Please select an activity type"),
  subject: z
    .string()
    .min(2, "Subject must be at least 2 characters")
    .max(160, "Subject is too long"),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  duration: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined || Number.isNaN(value)
        ? undefined
        : Number(value),
    z
      .number({ invalid_type_error: "Duration must be a number" })
      .min(1, "Duration must be at least 1 minute")
      .max(720, "Duration can't exceed 12 hours")
      .optional()
  ),
});
