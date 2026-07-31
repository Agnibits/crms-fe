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
import { cn } from "@/utils/cn";
import { FormInput, FormNumber, FormSelect, FormSwitch, FormTextarea } from "@/components/forms/fields";
import { useSettingItems } from "@/features/settings/hooks";

/** Naive English pluralizer good enough for section labels (branch→branches). */
function pluralize(word = "") {
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

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
  icon,
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
    let node;
    switch (field.type) {
      case "number":
        node = <FormNumber register={register} {...common} />;
        break;
      case "select":
        node = <FormSelect control={control} options={field.options || []} {...common} />;
        break;
      case "switch":
        node = <FormSwitch control={control} {...common} />;
        break;
      case "textarea":
        node = <FormTextarea register={register} rows={field.rows ?? 3} {...common} />;
        break;
      default:
        node = <FormInput register={register} {...common} />;
    }
    // Fields are full-width by default; opt a field into half-width with `half`
    // (switches always span full). Keeps single-field sections unchanged.
    const spanHalf = field.half && field.type !== "switch";
    return (
      <div key={field.name} className={cn("min-w-0", !spanHalf && "sm:col-span-2")}>
        {node}
      </div>
    );
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
            icon={icon}
            title={emptyTitle || `No ${pluralize(itemLabel.toLowerCase())} yet`}
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
                    <TableHead key={col.key} className={cn(col.className, col.headClassName)}>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
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
