"use client";

import { useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDatePicker, FormSelect, FormTextarea } from "@/components/forms/fields";
import { quoteSchema } from "@/validations/quote.schema";
import { productHooks } from "@/features/products/hooks";
import { useCustomerOptions } from "@/features/quotes/hooks";
import { formatCurrency } from "@/utils/format";

const emptyItem = { productId: "", productName: "", quantity: 1, unitPrice: 0, taxRate: 0 };

function defaultValidUntil() {
  const d = new Date(Date.now() + 30 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Quote builder: customer select, dynamic line items (product + qty +
 * editable unit price), discount / tax and live totals.
 *   <QuoteBuilder onSubmit={fn} submitting={bool} />
 */
export default function QuoteBuilder({ defaultValues, onSubmit, submitting = false, submitLabel = "Save Quote" }) {
  const customers = useCustomerOptions(100);
  const products = productHooks.useList({ page: 1, limit: 100, status: "active" });

  const customerOptions = (customers.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
  const productList = products.data?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerId: defaultValues?.customerId ?? "",
      items: defaultValues?.items?.length
        ? defaultValues.items.map((it) => ({
            productId: it.productId,
            productName: it.productName ?? "",
            quantity: it.quantity ?? 1,
            unitPrice: it.unitPrice ?? 0,
            taxRate: it.taxRate ?? 0,
          }))
        : [{ ...emptyItem }],
      discount: defaultValues?.discount ?? 0,
      tax: defaultValues?.tax ?? 0,
      validUntil: defaultValues?.validUntil?.slice(0, 10) ?? defaultValidUntil(),
      notes: defaultValues?.notes ?? "Thank you for your business.",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = watch("items");
  const discount = watch("discount");
  const tax = watch("tax");

  const totals = useMemo(() => {
    const lines = (watchedItems ?? []).map((item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      return qty * price;
    });
    const subtotal = lines.reduce((acc, v) => acc + v, 0);
    const total = subtotal - (Number(discount) || 0) + (Number(tax) || 0);
    return { lines, subtotal, total };
  }, [watchedItems, discount, tax]);

  const handleProductChange = (index, productId) => {
    const product = productList.find((p) => p.id === productId);
    setValue(`items.${index}.productId`, productId, { shouldValidate: true });
    if (product) {
      setValue(`items.${index}.productName`, product.name);
      setValue(`items.${index}.unitPrice`, product.price, { shouldValidate: true });
      setValue(`items.${index}.taxRate`, product.taxRate ?? 0);
    }
  };

  const submit = (values) => {
    const customer = (customers.data?.items ?? []).find((c) => c.id === values.customerId);
    const items = values.items.map((item) => ({
      productId: item.productId,
      productName:
        item.productName || productList.find((p) => p.id === item.productId)?.name || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((acc, it) => acc + it.total, 0);
    onSubmit?.({
      number: defaultValues?.number ?? `QT-${String(Date.now()).slice(-6)}`,
      customerId: values.customerId,
      customerName: customer?.name ?? defaultValues?.customerName ?? "",
      status: defaultValues?.status ?? "draft",
      items,
      subtotal,
      discount: values.discount || 0,
      tax: values.tax || 0,
      total: subtotal - (values.discount || 0) + (values.tax || 0),
      validUntil: new Date(`${values.validUntil}T00:00:00`).toISOString(),
      notes: values.notes ?? "",
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {/* Customer + validity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quote details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            control={control}
            name="customerId"
            label="Customer"
            required
            error={errors.customerId}
            options={customerOptions}
            placeholder={customers.isPending ? "Loading customers…" : "Select customer"}
            disabled={customers.isPending}
          />
          <FormDatePicker
            register={register}
            name="validUntil"
            label="Valid until"
            required
            error={errors.validUntil}
          />
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Line items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.isPending ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : (
            <>
              {/* Column labels (desktop) */}
              <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-muted-foreground md:grid">
                <span className="col-span-5">Product</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Unit price</span>
                <span className="col-span-2 text-right">Line total</span>
                <span className="col-span-1" />
              </div>
              {fields.map((field, index) => {
                const itemErrors = errors.items?.[index];
                return (
                  <div key={field.id} className="grid grid-cols-12 items-start gap-2 rounded-lg border p-3 md:border-0 md:p-0">
                    <div className="col-span-12 md:col-span-5">
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field: f }) => (
                          <Select
                            value={f.value || undefined}
                            onValueChange={(v) => handleProductChange(index, v)}
                          >
                            <SelectTrigger aria-invalid={!!itemErrors?.productId} className="w-full">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {productList.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} · {formatCurrency(p.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {itemErrors?.productId && (
                        <p className="mt-1 text-xs font-medium text-destructive">
                          {itemErrors.productId.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        aria-label="Quantity"
                        className="text-right tabular-nums"
                        aria-invalid={!!itemErrors?.quantity}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                      {itemErrors?.quantity && (
                        <p className="mt-1 text-xs font-medium text-destructive">
                          {itemErrors.quantity.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        aria-label="Unit price"
                        className="text-right tabular-nums"
                        aria-invalid={!!itemErrors?.unitPrice}
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                      {itemErrors?.unitPrice && (
                        <p className="mt-1 text-xs font-medium text-destructive">
                          {itemErrors.unitPrice.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 flex h-9 items-center justify-end md:col-span-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(totals.lines[index] ?? 0)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove line item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {errors.items?.root && (
                <p className="text-xs font-medium text-destructive">{errors.items.root.message}</p>
              )}
              {typeof errors.items?.message === "string" && (
                <p className="text-xs font-medium text-destructive">{errors.items.message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Adjustments + totals */}
      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="discount">Discount (amount)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="any"
                  aria-invalid={!!errors.discount}
                  {...register("discount", { valueAsNumber: true })}
                />
                {errors.discount && (
                  <p className="text-xs font-medium text-destructive">{errors.discount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax">Tax (amount)</Label>
                <Input
                  id="tax"
                  type="number"
                  min={0}
                  step="any"
                  aria-invalid={!!errors.tax}
                  {...register("tax", { valueAsNumber: true })}
                />
                {errors.tax && (
                  <p className="text-xs font-medium text-destructive">{errors.tax.message}</p>
                )}
              </div>
            </div>
            <FormTextarea
              register={register}
              name="notes"
              label="Notes"
              error={errors.notes}
              rows={3}
              placeholder="Terms, delivery info, thank-you note…"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="ml-auto w-full max-w-xs space-y-2 rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums text-foreground">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span className="tabular-nums text-foreground">− {formatCurrency(Number(discount) || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums text-foreground">{formatCurrency(Number(tax) || 0)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
