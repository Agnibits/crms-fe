"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Package, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productHooks, useUploadProductImage } from "@/features/products/hooks";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/utils/format";
import ImageLightbox from "@/components/common/ImageLightbox";

const PRODUCT_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "archived", label: "Archived", color: "gray" },
];

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const STOCK_STATUS = {
  IN_STOCK: { label: "In stock", cls: "bg-success/15 text-success" },
  LOW_STOCK: {
    label: "Low stock",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    cls: "bg-destructive/15 text-destructive",
  },
};

function StockStatusBadge({ status }) {
  const s = STOCK_STATUS[status] || STOCK_STATUS.OUT_OF_STOCK;
  return <Badge className={s.cls}>{s.label}</Badge>;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    data: product,
    isPending,
    error,
    refetch,
  } = productHooks.useDetail(id);
  const remove = productHooks.useRemove();
  const uploadImage = useUploadProductImage();
  const fileRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadImage.mutate({ id, file });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  const margin =
    product.price > 0
      ? ((product.price - product.cost) / product.price) * 100
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · ${product.categoryName || "Uncategorized"}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/products/${id}/edit`)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      {/* Summary card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-white dark:bg-muted/40">
              {product.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  title="View full image"
                  className="block h-full w-full cursor-zoom-in"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadImage.isPending}
                  aria-label="Upload product image"
                  className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary"
                >
                  <ImagePlus className="h-3 w-3" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
            <div>
              <CardTitle className="text-base">{product.name}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Added {formatDate(product.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {product.categoryName || "Uncategorized"}
            </Badge>
            <StatusBadge value={product.status} options={PRODUCT_STATUSES} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Selling price"
              value={formatCurrency(product.price)}
              sub={`per ${product.unit}`}
            />
            <Stat label="Cost price" value={formatCurrency(product.cost)} />
            <Stat
              label="Margin"
              value={formatPercent(margin)}
              sub={`${formatCurrency(product.price - product.cost)} per ${product.unit}`}
            />
            <Stat label="Tax rate" value={formatPercent(product.taxRate, 0)} />
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Inventory</p>
              <StockStatusBadge status={product.stockStatus} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="On hand" value={formatNumber(product.stock)} />
              <Stat
                label="Reserved"
                value={formatNumber(product.reservedStock ?? 0)}
              />
              <Stat
                label="Available"
                value={formatNumber(product.availableStock ?? product.stock)}
              />
              <Stat
                label="Reorder level"
                value={formatNumber(product.reorderLevel ?? 0)}
              />
            </div>
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ImageLightbox
        src={product.imageUrl}
        alt={product.name}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete product?"
        description="This product will be removed from your catalog."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(id, { onSuccess: () => router.push("/products") })
        }
      />
    </div>
  );
}
