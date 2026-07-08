"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { emailTemplateService } from "@/services/emailTemplate.service";

/** Standard CRUD hooks for email templates (name, subject, body, isActive). */
export const emailTemplateHooks = createCrudHooks({
  key: ["email-templates"],
  service: emailTemplateService,
  label: "Template",
});
