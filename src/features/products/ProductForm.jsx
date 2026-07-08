"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormInput,
  FormNumber,
  FormSelect,
  FormTextarea,
} from "@/components/forms/fields";
import { productSchema } from "@/validations/product.schema";
import { productCategoryHooks, useProductUnits } from "@/features/products/hooks";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

/**
 * Shared create/edit product form.
 *   <ProductForm defaultValues={product} onSubmit={fn} submitting={bool} submitLabel="Save" />
 */
export default function ProductForm({ defaultValues, onSubmit, submitting = false, submitLabel = "Save Product" }) {
  const categories = productCategoryHooks.useList({ page: 1, limit: 100 });
  const categoryOptions = (categories.data?.items ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const { data: unitOptions = [] } = useProductUnits();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      sku: defaultValues?.sku ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      price: defaultValues?.price ?? 0,
      cost: defaultValues?.cost ?? 0,
      stock: defaultValues?.stock ?? 0,
      reservedStock: defaultValues?.reservedStock ?? 0,
      reorderLevel: defaultValues?.reorderLevel ?? 0,
      unit: defaultValues?.unit ?? "",
      taxRate: defaultValues?.taxRate ?? 18,
      status: defaultValues?.status ?? "active",
      description: defaultValues?.description ?? "",
    },
  });

  const submit = (values) => {
    const category = (categories.data?.items ?? []).find((c) => c.id === values.categoryId);
    onSubmit?.({ ...values, categoryName: category?.name ?? defaultValues?.categoryName ?? "" });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            register={register}
            name="name"
            label="Name"
            required
            error={errors.name}
            placeholder="e.g. CRM Pro License"
          />
          <FormInput
            register={register}
            name="sku"
            label="SKU"
            required
            error={errors.sku}
            placeholder="e.g. SKU-1042"
          />
          <FormSelect
            control={control}
            name="categoryId"
            label="Category"
            required
            error={errors.categoryId}
            options={categoryOptions}
            placeholder={categories.isPending ? "Loading categories…" : "Select category"}
            disabled={categories.isPending}
          />
          <FormSelect
            control={control}
            name="unit"
            placeholder="Select unit"
            label="Unit"
            required
            error={errors.unit}
            options={unitOptions}
          />
          <FormNumber
            register={register}
            name="price"
            label="Selling price"
            required
            error={errors.price}
            min={0}
          />
          <FormNumber
            register={register}
            name="cost"
            label="Cost price"
            required
            error={errors.cost}
            min={0}
          />
          <FormNumber
            register={register}
            name="stock"
            label="Stock on hand"
            required
            error={errors.stock}
            min={0}
            step={1}
          />
          <FormNumber
            register={register}
            name="reservedStock"
            label="Reserved stock"
            error={errors.reservedStock}
            min={0}
            step={1}
            hint="Committed to open orders — not available to sell."
          />
          <FormNumber
            register={register}
            name="reorderLevel"
            label="Reorder level"
            error={errors.reorderLevel}
            min={0}
            step={1}
            hint="Flag as low stock at or below this quantity."
          />
          <FormNumber
            register={register}
            name="taxRate"
            label="Tax rate (%)"
            required
            error={errors.taxRate}
            min={0}
            max={100}
            hint="GST/VAT percentage applied on this product"
          />
          <FormSelect
            control={control}
            name="status"
            label="Status"
            required
            error={errors.status}
            options={STATUS_OPTIONS}
          />
          <FormTextarea
            register={register}
            name="description"
            label="Description"
            error={errors.description}
            placeholder="Short description shown on quotes and orders"
            className="sm:col-span-2"
            rows={4}
          />
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
