import { z } from "zod";

// Who a campaign is sent to. `value` maps to the backend audience type; the
// server resolves it to that CRM group's emailable records at send time.
export const CAMPAIGN_AUDIENCES = [
  { value: "CUSTOMERS", label: "All Customers" },
  { value: "LEADS", label: "All Leads" },
  { value: "CONTACTS", label: "All Contacts" },
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
