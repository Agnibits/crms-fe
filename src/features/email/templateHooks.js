"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { createCrudHooks } from "@/hooks/useCrud";
import { emailTemplateService } from "@/services/emailTemplate.service";

/** Standard CRUD hooks for email templates (name, subject, body, isActive). */
export const emailTemplateHooks = createCrudHooks({
  key: ["email-templates"],
  service: emailTemplateService,
  label: "Template",
});

/**
 * Templates offered in a composer. Inactive ones are filtered out here so an
 * author can retire a template without deleting it and have it disappear from
 * every composer at once.
 */
export function useTemplateOptions() {
  const query = useQuery({
    queryKey: ["email-templates", "list", { limit: 100 }],
    queryFn: ({ signal }) => emailTemplateService.list({ limit: 100 }, { signal }),
    staleTime: 60_000,
  });
  const templates = (query.data?.items ?? []).filter((t) => t.isActive !== false);
  return { ...query, templates, hasTemplates: templates.length > 0 };
}

/** The placeholders a template may use — rarely changes, so cached hard. */
export function useTemplateVariables() {
  const query = useQuery({
    queryKey: ["email-templates", "variables"],
    queryFn: ({ signal }) => emailTemplateService.variables({ signal }),
    staleTime: 30 * 60_000,
  });
  return { ...query, variables: query.data ?? [] };
}

/** Fill a template's placeholders for a given ticket / customer. */
export function useRenderTemplate() {
  return useMutation({
    mutationFn: ({ id, ticketId, customerId }) =>
      emailTemplateService.render(id, { ticketId, customerId }),
  });
}
