"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toastError } from "@/services/api";
import { useTemplateOptions, useRenderTemplate } from "./templateHooks";

/**
 * Insert a saved reply into a composer, with its placeholders already filled
 * in for this ticket / customer.
 *
 * Renders nothing when the company has no active templates: an always-visible
 * button that opens an empty list is the kind of dead control we removed
 * elsewhere. The Settings page is where templates get created.
 *
 * @param {object} props
 * @param {string} [props.ticketId]   - ticket being replied to
 * @param {string} [props.customerId] - customer, when there is no ticket
 * @param {(t: {subject: string, body: string}) => void} props.onInsert
 * @param {boolean} [props.disabled]
 */
export default function TemplatePicker({ ticketId, customerId, onInsert, disabled = false }) {
  const { templates, hasTemplates, isPending } = useTemplateOptions();
  const render = useRenderTemplate();
  const [openId, setOpenId] = useState(null);

  if (isPending || !hasTemplates) return null;

  const choose = (template) => {
    setOpenId(template.id);
    render.mutate(
      { id: template.id, ticketId, customerId },
      {
        onSuccess: (data) => onInsert({ subject: data.subject, body: data.body }),
        onError: (error) => toastError(error, "Could not load that template"),
        onSettled: () => setOpenId(null),
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || render.isPending}
          loading={render.isPending}
        >
          <FileText className="h-4 w-4" /> Use template
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-64 overflow-y-auto">
        {templates.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => choose(t)}
            disabled={render.isPending && openId === t.id}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="font-medium">{t.name}</span>
            <span className="w-full truncate text-xs text-muted-foreground">{t.subject}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
