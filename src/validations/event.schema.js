import { z } from "zod";

export const eventSchema = z
  .object({
    title: z
      .string()
      .min(2, "Title must be at least 2 characters")
      .max(160, "Title is too long"),
    type: z.string().min(1, "Please select an event type"),
    start: z.string().min(1, "Start date & time is required"),
    end: z.string().min(1, "End date & time is required"),
    location: z.string().max(160, "Location is too long").optional().or(z.literal("")),
  })
  .refine(
    (values) => {
      if (!values.start || !values.end) return true;
      return new Date(values.end).getTime() > new Date(values.start).getTime();
    },
    { message: "End must be after start", path: ["end"] }
  );
