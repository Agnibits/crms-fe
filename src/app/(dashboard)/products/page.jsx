"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  Download,
  Eye,
  FolderCog,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import CategoriesDialog from "@/features/products/CategoriesDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableState } from "@/hooks/useTableState";
import { productHooks, productCategoryHooks } from "@/features/products/hooks";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatNumber } from "@/utils/format";

const PRODUCT_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "archived", label: "Archived", color: "gray" },
];

const LOW_STOCK_THRESHOLD = 20;
const MAX_STOCK = 500;

function StockCell({ stock, type }) {
  // Services aren't stocked — don't imply "0 in stock".
  if (type === "SERVICE")
    return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      {formatNumber(stock)}
      {stock < LOW_STOCK_THRESHOLD && (
        <Badge
          variant="outline"
          className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="h-3 w-3" /> Low
        </Badge>
      )}
    </span>
  );
}

function InventoryTab() {
  const { data, isPending, error, refetch } = productHooks.useList({
    page: 1,
    limit: 100,
    sortBy: "stock",
    sortOrder: "asc",
  });
  const items = data?.items ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        {error ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        ) : isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No inventory to show"
            description="Add products to start tracking stock levels."
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="w-[220px]">Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-right">
                    <StockCell stock={product.stock} type={product.type} />
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {product.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(100, (product.stock / MAX_STOCK) * 100)}
                        className="h-1.5"
                        indicatorClassName={
                          product.stock < LOW_STOCK_THRESHOLD
                            ? "bg-amber-500"
                            : undefined
                        }
                      />
                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {Math.round((product.stock / MAX_STOCK) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = productHooks.useList(
    t.queryParams,
  );
  const categories = productCategoryHooks.useList({ page: 1, limit: 100 });
  const remove = productHooks.useRemove();
  const bulkRemove = productHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white dark:bg-muted/40 text-muted-foreground">
              {row.original.imageUrl ? (
                <img
                  src={row.original.imageUrl}
                  alt={row.original.name}
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.categoryName}
              </p>
            </div>
          </div>
        ),
      },
      { accessorKey: "sku", header: "SKU" },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatCurrency(row.original.cost)}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Selling",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <StockCell stock={row.original.stock} type={row.original.type} />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge value={row.original.status} options={PRODUCT_STATUSES} />
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => router.push(`/products/${row.original.id}`)}
              >
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/products/${row.original.id}/edit`)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing and stock levels."
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
              <FolderCog className="h-4 w-4" /> Manage categories
            </Button>
            <Button onClick={() => router.push("/products/new")}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </>
        }
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Boxes className="h-4 w-4" /> Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            loading={isPending}
            error={error}
            onRetry={refetch}
            pageCount={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            {...t.tableProps}
            enableRowSelection
            searchPlaceholder="Search products…"
            onRowClick={(row) => router.push(`/products/${row.id}`)}
            emptyTitle="No products found"
            emptyDescription="Try a different search, or add your first product."
            toolbar={
              <Select
                value={t.filters.categoryId ?? "all"}
                onValueChange={(v) => t.setFilter("categoryId", v)}
              >
                <SelectTrigger
                  className="w-[180px]"
                  aria-label="Filter by category"
                >
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categories.data?.items ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            actions={
              <Button
                variant="outline"
                onClick={() =>
                  exportToCsv(data?.items ?? [], "products.csv", [
                    { key: "name", label: "Name" },
                    { key: "sku", label: "SKU" },
                    { key: "categoryName", label: "Category" },
                    { key: "price", label: "Price" },
                    { key: "cost", label: "Cost" },
                    { key: "stock", label: "Stock" },
                    { key: "unit", label: "Unit" },
                    { key: "status", label: "Status" },
                  ])
                }
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            }
            bulkActions={(rows, clear) => (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  bulkRemove.mutate(
                    rows.map((r) => r.id),
                    { onSuccess: clear },
                  )
                }
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <InventoryTab />
        </TabsContent>
      </Tabs>

      <CategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete product?"
        description="This product will be removed from your catalog."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }
      />
    </div>
  );
}
