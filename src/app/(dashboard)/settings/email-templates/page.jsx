"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { emailTemplateHooks } from "@/features/email/templateHooks";
import TemplateDialog from "@/features/email/TemplateDialog";

export default function EmailTemplatesPage() {
  const { data, isPending, error, refetch } = emailTemplateHooks.useList({ limit: 100 });
  const remove = emailTemplateHooks.useRemove();

  const [dialog, setDialog] = useState({ open: false, template: null });
  const [deleteId, setDeleteId] = useState(null);

  const templates = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Email templates</CardTitle>
          <CardDescription>Reusable subject + body snippets for emailing customers.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setDialog({ open: true, template: null })}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create one to speed up replying to customers."
            className="border-0"
          />
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {t.name}
                    {t.isActive === false && <Badge variant="secondary">Inactive</Badge>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{t.subject}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setDialog({ open: true, template: t })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive" onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TemplateDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ open, template: open ? prev.template : null }))}
        template={dialog.template}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        destructive
        title="Delete template?"
        description="This template will be removed permanently."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </Card>
  );
}
