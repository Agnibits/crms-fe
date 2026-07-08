import { z } from "zod";

const port = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
  z.number().int("Enter a valid port").min(1).max(65535).optional()
);

/** Connect a company email channel: SMTP (send) + IMAP (receive replies). */
export const emailChannelSchema = z.object({
  fromName: z.string().max(120).optional().or(z.literal("")),
  fromEmail: z.string().min(1, "From email is required").email("Enter a valid email"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: port,
  smtpUser: z.string().min(1, "SMTP user is required"),
  smtpPass: z.string().min(1, "SMTP password / app password is required"),
  smtpSecure: z.boolean().optional(),
  imapHost: z.string().optional().or(z.literal("")),
  imapPort: port,
  imapUser: z.string().optional().or(z.literal("")),
  imapPass: z.string().optional().or(z.literal("")),
});
