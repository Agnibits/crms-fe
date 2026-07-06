"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { FormInput, FormNumber, FormSelect, FormSwitch } from "@/components/forms/fields";
import { useSettingItems } from "@/features/settings/hooks";

function buildFormValues(fields, item) {
  return Object.fromEntries(
    fields.map((f) => {
      const fallback = f.type === "switch" ? false : "";
      return [f.name, item?.[f.name] ?? fallback];
    })
  );
}

/**
 * Generic small CRUD table for array settings sections
 * (branches / departments / teams and similar).
 *
 * columns: [{ key, header, className, render?(item) }]
 * fields:  [{ name, label, type: "text"|"number"|"select"|"switch", options?, required?, placeholder?, hint? }]
 */
export default function SectionCrudTable({
  sectionKey,
  itemLabel = "Item",
  title,
  description,
  columns = [],
  fields = [],
  schema,
  emptyTitle,
  emptyDescription,
}) {
  const { query, create, update, remove } = useSettingItems(sectionKey, { label: itemLabel });
  const items = Array.isArray(query.data) ? query.data : [];

  const [dialog, setDialog] = useState({ open: false, item: null });
  const [deleteId, setDeleteId] = useState(null);
  const submitting = create.isPending || update.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: buildFormValues(fields, dialog.item),
  });

  const closeDialog = () => {
    setDialog({ open: false, item: null });
    reset(buildFormValues(fields, null));
  };

  const onSubmit = (values) => {
    if (dialog.item?.id) {
      update.mutate({ id: dialog.item.id, ...values }, { onSuccess: closeDialog });
    } else {
      create.mutate(values, { onSuccess: closeDialog });
    }
  };

  const renderField = (field) => {
    const common = {
      key: field.name,
      name: field.name,
      label: field.label,
      error: errors[field.name],
      required: field.required,
      hint: field.hint,
      placeholder: field.placeholder,
      className: field.className,
    };
    switch (field.type) {
      case "number":
        return <FormNumber register={register} {...common} />;
      case "select":
        return <FormSelect control={control} options={field.options || []} {...common} />;
      case "switch":
        return <FormSwitch control={control} {...common} />;
      default:
        return <FormInput register={register} {...common} />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        <Button size="sm" onClick={() => setDialog({ open: true, item: null })}>
          <Plus /> Add {itemLabel.toLowerCase()}
        </Button>
      </CardHeader>
      <CardContent>
        {query.error ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={emptyTitle || `No ${itemLabel.toLowerCase()}s yet`}
            description={emptyDescription || `Add your first ${itemLabel.toLowerCase()} to get started.`}
            actionLabel={`Add ${itemLabel.toLowerCase()}`}
            onAction={() => setDialog({ open: true, item: null })}
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.header}
                    </TableHead>
                  ))}
                  <TableHead className="w-20 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? col.render(item) : (item[col.key] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.name || itemLabel}`}
                          onClick={() => setDialog({ open: true, item })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.name || itemLabel}`}
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add / edit dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.item ? `Edit ${itemLabel.toLowerCase()}` : `Add ${itemLabel.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {dialog.item
                ? `Update the details of this ${itemLabel.toLowerCase()}.`
                : `Create a new ${itemLabel.toLowerCase()} for your organisation.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4">{fields.map(renderField)}</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {dialog.item ? "Save changes" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        destructive
        title={`Delete ${itemLabel.toLowerCase()}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </Card>
  );
}
