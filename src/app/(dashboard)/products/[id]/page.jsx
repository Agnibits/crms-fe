"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productHooks } from "@/features/products/hooks";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/utils/format";

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: product, isPending, error, refetch } = productHooks.useDetail(id);
  const remove = productHooks.useRemove();
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;

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
            <Button variant="outline" onClick={() => router.push(`/products/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      {/* Summary card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">{product.name}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Added {formatDate(product.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product.categoryName || "Uncategorized"}</Badge>
            <StatusBadge value={product.status} options={PRODUCT_STATUSES} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Selling price" value={formatCurrency(product.price)} sub={`per ${product.unit}`} />
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
              <p className="text-sm font-medium">Stock on hand</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatNumber(product.stock)} {product.unit}s
              </p>
            </div>
            <Progress
              value={Math.min(100, (product.stock / 500) * 100)}
              className="mt-3"
              indicatorClassName={product.stock < 20 ? "bg-amber-500" : undefined}
            />
            {product.stock < 20 && (
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Low stock — consider restocking soon.
              </p>
            )}
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 text-sm leading-relaxed">{product.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
