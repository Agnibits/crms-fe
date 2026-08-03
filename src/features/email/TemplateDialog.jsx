"use client";

import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormSwitch, FieldWrapper } from "@/components/forms/fields";
import { Textarea } from "@/components/ui/textarea";
import { emailTemplateHooks, useTemplateVariables } from "./templateHooks";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required"),
  isActive: z.boolean().optional(),
});

const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/** Substitute the sample values so the author reads a sentence, not braces. */
function preview(text, samples) {
  return String(text || "").replace(PLACEHOLDER, (match, key) => {
    const sample = samples.get(key.toLowerCase());
    return sample === undefined ? match : sample;
  });
}

/** Placeholders used in the text that the server does not know about. */
function unknownIn(text, samples) {
  const out = new Set();
  for (const m of String(text || "").matchAll(PLACEHOLDER)) {
    if (!samples.has(m[1].toLowerCase())) out.add(m[1]);
  }
  return [...out];
}

/** Create / edit an email template. Pass `template={null}` to create. */
export default function TemplateDialog({ open, onOpenChange, template = null }) {
  const isEdit = !!template?.id;
  const create = emailTemplateHooks.useCreate();
  const update = emailTemplateHooks.useUpdate();
  const submitting = create.isPending || update.isPending;

  const { variables } = useTemplateVariables();
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
      isActive: template?.isActive ?? true,
    },
  });

  const samples = useMemo(
    () => new Map(variables.map((v) => [v.key, v.sample])),
    [variables]
  );
  const grouped = useMemo(() => {
    const map = new Map();
    for (const v of variables) {
      if (!map.has(v.group)) map.set(v.group, []);
      map.get(v.group).push(v);
    }
    return [...map.entries()];
  }, [variables]);

  const watched = useWatch({ control, name: ["subject", "body"] });
  const [subjectText, bodyText] = watched ?? ["", ""];
  // Surfaced before saving; the server rejects these too, but an author should
  // see the problem while they are still looking at the text that caused it.
  const unknown = useMemo(
    () =>
      samples.size
        ? [...new Set([...unknownIn(subjectText, samples), ...unknownIn(bodyText, samples)])]
        : [],
    [subjectText, bodyText, samples]
  );

  const close = () => {
    onOpenChange(false);
    setShowPreview(false);
    reset();
  };

  /** Insert at the caret so a variable lands where the author is typing. */
  const insertVariable = (key) => {
    const token = `{{${key}}}`;
    const el = bodyRef.current;
    const current = getValues("body") ?? "";
    if (!el) {
      setValue("body", current + token, { shouldValidate: true, shouldDirty: true });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setValue("body", next, { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const onSubmit = (values) => {
    if (isEdit) update.mutate({ id: template.id, ...values }, { onSuccess: close });
    else create.mutate(values, { onSuccess: close });
  };

  // Textarea is rendered directly rather than through FormTextarea: the wrapper
  // calls register() itself and drops the ref, and the ref is what lets an
  // inserted variable land at the caret instead of at the end of the body.
  const { ref: bodyFieldRef, ...bodyField } = register("body");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormInput
            register={register}
            name="name"
            label="Template name"
            placeholder="Refund acknowledged"
            required
            error={errors.name}
          />
          <FormInput
            register={register}
            name="subject"
            label="Subject"
            placeholder="Re: {{ticket_number}}"
            required
            error={errors.subject}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Body</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>

            {showPreview ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="mb-2 font-medium">{preview(subjectText, samples) || "(no subject)"}</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {preview(bodyText, samples) || "(empty)"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Sample values shown. Real customer details are filled in when the template is used.
                </p>
              </div>
            ) : (
              <FieldWrapper name="body" error={errors.body}>
                <Textarea
                  id="body"
                  rows={8}
                  aria-invalid={!!errors.body}
                  placeholder="Hi {{customer_name}}, …"
                  {...bodyField}
                  ref={(el) => {
                    bodyFieldRef(el);
                    bodyRef.current = el;
                  }}
                />
              </FieldWrapper>
            )}
          </div>

          {unknown.length > 0 && (
            <p className="text-sm text-destructive">
              Unknown placeholder{unknown.length > 1 ? "s" : ""}:{" "}
              {unknown.map((k) => `{{${k}}}`).join(", ")}. These will not be replaced.
            </p>
          )}

          {grouped.length > 0 && !showPreview && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium">Insert a variable</p>
              <div className="space-y-2">
                {grouped.map(([group, items]) => (
                  <div key={group} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{group}</span>
                    {items.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        title={`Example: ${v.sample}`}
                        className="rounded border bg-background px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormSwitch
            control={control}
            name="isActive"
            label="Active"
            hint="Inactive templates stay saved but are not offered when replying."
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
