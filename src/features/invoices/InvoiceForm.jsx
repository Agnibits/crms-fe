"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDatePicker, FormSelect, FormTextarea } from "@/components/forms/fields";
import { useCustomerOptions } from "@/features/contacts/hooks";
import { formatCurrency } from "@/utils/format";

/** yyyy-MM-dd, `days` from today. */
function dateInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EMPTY_ITEM = { description: "", quantity: 1, unitPrice: "", taxRate: "" };

/**
 * Standalone invoice form: customer, due date and line items.
 * Totals are computed by the backend; the live summary here is a preview.
 *   <InvoiceForm defaultValues={{ customerId, items: [...] }} onSubmit={fn} />
 */
export default function InvoiceForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = "Create Invoice",
  onCancel,
  // Edit mode: the backend doesn't change an invoice's customer on update.
  lockCustomer = false,
}) {
  const router = useRouter();
  const customers = useCustomerOptions();
  const noCustomers = !customers.isPending && customers.options.length === 0;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerId: "",
      dueDate: dateInDays(15),
      notes: "",
      items: [{ ...EMPTY_ITEM }],
      ...defaultValues,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const items = watch("items") ?? [];
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const taxTotal = items.reduce(
    (acc, it) =>
      acc +
      ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * (Number(it.taxRate) || 0)) / 100,
    0
  );

  const submit = (values) => {
    onSubmit({
      customerId: values.customerId,
      dueDate: values.dueDate || undefined,
      notes: values.notes?.trim() || undefined,
      items: values.items
        .filter((it) => it.description.trim() && Number(it.unitPrice) > 0)
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice),
          ...(it.taxRate !== "" && it.taxRate !== undefined
            ? { taxRate: Number(it.taxRate) }
            : {}),
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {noCustomers && !lockCustomer && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">
                You have no customers yet — add one before billing.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/customers/new")}
              >
                <UserPlus /> New Customer
              </Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              control={control}
              name="customerId"
              label="Customer"
              required
              rules={{ required: "Select a customer" }}
              options={customers.options}
              placeholder={noCustomers ? "No customers yet" : "Select a customer…"}
              disabled={lockCustomer}
              hint={
                lockCustomer ? "The customer can't be changed on an existing invoice." : undefined
              }
              error={errors.customerId}
            />
            <FormDatePicker
              register={register}
              name="dueDate"
              label="Due Date"
              error={errors.dueDate}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ ...EMPTY_ITEM })}
          >
            <Plus /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, i) => (
            <div
              key={field.id}
              className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3"
            >
              <div className="col-span-12 space-y-1.5 sm:col-span-5">
                {i === 0 && <Label>Description</Label>}
                <Input
                  placeholder="e.g. CRM implementation"
                  aria-invalid={!!errors.items?.[i]?.description}
                  {...register(`items.${i}.description`, { required: "Required" })}
                />
                {errors.items?.[i]?.description && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.items[i].description.message}
                  </p>
                )}
              </div>
              <div className="col-span-3 space-y-1.5 sm:col-span-2">
                {i === 0 && <Label>Qty</Label>}
                <Input
                  type="number"
                  min={1}
                  {...register(`items.${i}.quantity`)}
                />
              </div>
              <div className="col-span-5 space-y-1.5 sm:col-span-2">
                {i === 0 && <Label>Unit Price</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.items?.[i]?.unitPrice}
                  {...register(`items.${i}.unitPrice`, {
                    required: "Required",
                    validate: (v) => Number(v) > 0 || "Must be > 0",
                  })}
                />
                {errors.items?.[i]?.unitPrice && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.items[i].unitPrice.message}
                  </p>
                )}
              </div>
              <div className="col-span-3 space-y-1.5 sm:col-span-2">
                {i === 0 && <Label>Tax %</Label>}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  {...register(`items.${i}.taxRate`)}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove item"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-8 border-t pt-3 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="font-medium tabular-nums">{formatCurrency(subtotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Tax</p>
              <p className="font-medium tabular-nums">{formatCurrency(taxTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total</p>
              <p className="text-base font-semibold tabular-nums">
                {formatCurrency(subtotal + taxTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormTextarea
            register={register}
            name="notes"
            label=""
            rows={3}
            placeholder="Payment terms, bank details, or a thank-you note — shown on the invoice."
            error={errors.notes}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
