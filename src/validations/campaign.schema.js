import { z } from "zod";

export const CAMPAIGN_AUDIENCES = [
  "All Customers",
  "Active Leads",
  "Churned Customers",
  "Newsletter Subscribers",
];

export const campaignSchema = z
  .object({
    name: z
      .string()
      .min(2, "Campaign name must be at least 2 characters")
      .max(120, "Campaign name is too long"),
    type: z.enum(["email", "sms"], {
      errorMap: () => ({ message: "Select a campaign type" }),
    }),
    subject: z.string().max(150, "Subject is too long").optional().or(z.literal("")),
    body: z.string().max(5000, "Body is too long").optional().or(z.literal("")),
    message: z
      .string()
      .max(160, "SMS message cannot exceed 160 characters")
      .optional()
      .or(z.literal("")),
    audience: z.string().min(1, "Select an audience"),
    scheduledAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "email" && !data.subject?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "Subject is required for email campaigns",
      });
    }
    if (data.type === "sms" && !data.message?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["message"],
        message: "Message is required for SMS campaigns",
      });
    }
  });
