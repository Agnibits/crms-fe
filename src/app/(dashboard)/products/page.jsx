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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const STOCK_STATUS = {
  IN_STOCK: { label: "In stock", cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  LOW_STOCK: { label: "Low stock", cls: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  OUT_OF_STOCK: { label: "Out of stock", cls: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400" },
};

function StockStatusBadge({ status }) {
  const s = STOCK_STATUS[status] || STOCK_STATUS.OUT_OF_STOCK;
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
}

// Low/out is decided by the backend against each product's OWN reorder level
// (never a hardcoded threshold), so the list agrees with the detail page.
function StockCell({ stock, type, stockStatus }) {
  // Services aren't stocked — don't imply "0 in stock".
  if (type === "SERVICE") return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      {formatNumber(stock)}
      {stockStatus === "OUT_OF_STOCK" ? (
        <Badge
          variant="outline"
          className="border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
        >
          <AlertTriangle className="h-3 w-3" /> Out
        </Badge>
      ) : stockStatus === "LOW_STOCK" ? (
        <Badge
          variant="outline"
          className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="h-3 w-3" /> Low
        </Badge>
      ) : null}
    </span>
  );
}

const INVENTORY_PAGE_SIZE = 100;

function InventoryTab() {
  // Only GOODS carry stock — services are intentionally absent, which is why
  // this tab's count is lower than the Products tab. Filtering server-side (not
  // after paging) keeps the page full and the total honest.
  const { data, isPending, error, refetch } = productHooks.useList({
    page: 1,
    limit: INVENTORY_PAGE_SIZE,
    sortBy: "stock",
    sortOrder: "asc",
    type: "GOODS",
  });
  const items = data?.items ?? [];
  const total = data?.total ?? items.length;
  const truncated = total > items.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Stock levels</CardTitle>
        <CardDescription>
          {isPending
            ? "Loading stock levels…"
            : `${formatNumber(total)} stocked ${total === 1 ? "product" : "products"}, lowest stock first. Services aren't stocked, so they don't appear here.`}
          {truncated &&
            ` Showing the ${formatNumber(items.length)} lowest-stock items.`}
        </CardDescription>
      </CardHeader>
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
            title="No stocked products yet"
            description="Only goods carry stock — add a product of type Goods to start tracking levels."
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
                <TableHead className="text-right">Reorder at</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(product.stock)}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{product.unit}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(product.reorderLevel ?? 0)}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge status={product.stockStatus} />
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
  const { data, isPending, error, refetch } = productHooks.useList(t.queryParams);
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white text-muted-foreground dark:bg-muted/40">
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
              <p className="truncate text-xs text-muted-foreground">{row.original.categoryName}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "sku", header: "SKU" },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{formatCurrency(row.original.cost)}</span>
        ),
      },
      {
        accessorKey: "price",
        header: "Selling",
        cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.price)}</span>,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => <StockCell stock={row.original.stock} type={row.original.type} stockStatus={row.original.stockStatus} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge value={row.original.status} options={PRODUCT_STATUSES} />,
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
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/products/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/products/${row.original.id}/edit`)}>
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
    [router]
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
                <SelectTrigger className="w-[180px]" aria-label="Filter by category">
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
                onClick={() => bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })}
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

      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete product?"
        description="This product will be removed from your catalog."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
