"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormInput,
  FormNumber,
  FormSelect,
  FormTextarea,
} from "@/components/forms/fields";
import CategoriesDialog from "@/features/products/CategoriesDialog";
import { productSchema } from "@/validations/product.schema";
import { productCategoryHooks, useProductUnits } from "@/features/products/hooks";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const TYPE_OPTIONS = [
  { value: "GOODS", label: "Goods (physical, tracked in stock)" },
  { value: "SERVICE", label: "Service (no stock)" },
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Image is uploaded after the product is created (needs its id), so hold the
  // picked file and hand it to the parent alongside the form values.
  const fileRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(defaultValues?.imageUrl ?? null);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(defaultValues?.imageUrl ?? null);
  };

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "GOODS",
      sku: defaultValues?.sku ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      price: defaultValues?.price ?? "",
      cost: defaultValues?.cost ?? "",
      stock: defaultValues?.stock ?? "",
      reservedStock: defaultValues?.reservedStock ?? "",
      reorderLevel: defaultValues?.reorderLevel ?? "",
      unit: defaultValues?.unit ?? "",
      taxRate: defaultValues?.taxRate ?? "",
      status: defaultValues?.status ?? "active",
      description: defaultValues?.description ?? "",
    },
  });

  // Services have no inventory — hide stock/SKU fields when Service is chosen.
  const isService = watch("type") === "SERVICE";

  const submit = (values) => {
    const category = (categories.data?.items ?? []).find((c) => c.id === values.categoryId);
    onSubmit?.(
      { ...values, categoryName: category?.name ?? defaultValues?.categoryName ?? "" },
      imageFile
    );
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Product image — held locally, uploaded once the product exists. */}
          <div className="flex items-center gap-4 sm:col-span-2">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white dark:bg-muted/40">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Add image</span>
                </button>
              )}
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium">Product image</p>
              <p className="text-xs text-muted-foreground">
                Shown on the catalog, quotes and invoices. Optional.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {imagePreview ? "Change image" : "Upload image"}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
          </div>

          <FormSelect
            control={control}
            name="type"
            label="Type"
            required
            error={errors.type}
            options={TYPE_OPTIONS}
            hint="Services have no inventory — stock and SKU are hidden."
            className="sm:col-span-2"
          />
          <FormInput
            register={register}
            name="name"
            label="Name"
            required
            error={errors.name}
            placeholder={isService ? "e.g. CRM Implementation" : "e.g. CRM Pro License"}
          />
          {!isService && (
            <FormInput
              register={register}
              name="sku"
              label="SKU"
              error={errors.sku}
              placeholder="Auto-generated if left blank"
            />
          )}
          <div className="space-y-1.5">
            <FormSelect
              control={control}
              name="categoryId"
              label="Category"
              error={errors.categoryId}
              options={categoryOptions}
              placeholder={
                categories.isPending
                  ? "Loading categories…"
                  : categoryOptions.length
                    ? "Select category"
                    : "No categories yet"
              }
              disabled={categories.isPending}
            />
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              {categoryOptions.length ? "New category" : "Create your first category"}
            </button>
          </div>
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
            placeholder="0.00"
          />
          <FormNumber
            register={register}
            name="cost"
            label="Cost price"
            error={errors.cost}
            min={0}
            placeholder="0.00"
          />
          {!isService && (
            <>
              <FormNumber
                register={register}
                name="stock"
                label="Stock on hand"
                error={errors.stock}
                min={0}
                step={1}
                placeholder="0"
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
            </>
          )}
          <FormNumber
            register={register}
            name="taxRate"
            label="Tax rate (%)"
            error={errors.taxRate}
            min={0}
            max={100}
            placeholder="e.g. 13"
            hint="VAT/GST percentage applied on this product"
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

      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </form>
  );
}
