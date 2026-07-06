# Module Conventions — AgniBits CRM Frontend

Every feature module follows the exact same recipe. Read this before writing any module code. **JavaScript + JSX only (no TypeScript). Path alias `@/` → `src/`.**

## Golden rules

1. **Never modify existing shared files** (`components/ui`, `components/tables`, `components/forms`, `components/common`, `hooks`, `services/api.js`, `services/crud.factory.js`, `store`, `constants`, `middleware.js`, `app/layout.js`, `app/providers.jsx`). If you need something new, create it inside your feature directory.
2. **No npm installs, no builds, no dev servers.** All dependencies are already installed (see package.json). Do not run npm commands.
3. Any file using hooks/state/browser APIs starts with `"use client";`.
4. Pages that call `useSearchParams()` must be wrapped in `<Suspense>` (see `src/app/(auth)/login/page.jsx`).
5. All routes live under `src/app/(dashboard)/<route>/page.jsx` — the dashboard shell (sidebar/navbar) is applied by the group layout automatically.
6. Use `lucide-react` icons, `framer-motion` only for subtle entrance animations, `react-hot-toast` for toasts (already handled inside shared hooks).
7. Currency/date/number formatting **always** via `@/utils/format` (`formatCurrency`, `formatDate`, `formatDateTime`, `formatRelative`, `formatNumber`).
8. Status/stage/priority chips **always** via `<StatusBadge value={x} options={OPTIONS} />` with option lists from `@/constants/options`.

## API contract

- Envelope: `{ success, message, data }` — services already unwrap it.
- List responses: `data = { items, page, limit, total, totalPages }`.
- List params: `{ page, limit, search, sortBy, sortOrder, ...filters }`.
- A mock adapter (`NEXT_PUBLIC_USE_MOCK=true`) serves ALL endpoints generically (CRUD on any collection in `src/services/mock/db.js`, sub-resources like `/customers/:id/timeline|contacts|deals|invoices|files|tasks|notes`, actions like `POST /leads/:id/convert`). Check `db.js` for available fields per entity — build UI around those fields.

## Recipe for a module (e.g. customers)

### 1. Service — `src/services/customer.service.js`

```js
"use client";
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const customerService = {
  ...createCrudService(ENDPOINTS.customers),
  // module-specific extras only if needed:
  // convert: (id, payload) => createCrudService(ENDPOINTS.leads).action(id, "convert", payload),
};
```

### 2. Hooks — `src/features/customers/hooks.js`

```js
"use client";
import { createCrudHooks } from "@/hooks/useCrud";
import { customerService } from "@/services/customer.service";
import { QUERY_KEYS } from "@/constants/app";

export const customerHooks = createCrudHooks({
  key: QUERY_KEYS.customers,
  service: customerService,
  label: "Customer",
});
// customerHooks.useList(params) / useDetail(id) / useSub(id, "timeline") /
// useCreate() / useUpdate() / usePatch() (optimistic) / useRemove() /
// useBulkRemove() / useAction()
```

### 3. Validation — `src/validations/customer.schema.js`

Zod schema; strings with helpful messages; optional fields `.optional().or(z.literal(""))`.

### 4. List page — `src/app/(dashboard)/customers/page.jsx`

```jsx
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Upload, Trash2, Pencil, Eye, MoreHorizontal } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { customerHooks } from "@/features/customers/hooks";
import { CUSTOMER_STATUSES } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatDate } from "@/utils/format";

export default function CustomersPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = customerHooks.useList(t.queryParams);
  const remove = customerHooks.useRemove();
  const bulkRemove = customerHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(() => [
    selectionColumn,
    { accessorKey: "name", header: "Name", cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span> ) },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "status", header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} options={CUSTOMER_STATUSES} /> },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <DropdownMenu>…Eye → view, Pencil → edit, Trash2 → setDeleteId(row.original.id)…</DropdownMenu> ) },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="…" actions={
        <Button onClick={() => router.push("/customers/new")}><Plus /> Add Customer</Button>} />
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
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
        toolbar={<Select value={t.filters.status ?? "all"} onValueChange={(v) => t.setFilter("status", v)}>…</Select>}
        actions={<Button variant="outline" onClick={() => exportToCsv(data?.items ?? [], "customers.csv")}><Download /> Export</Button>}
        bulkActions={(rows, clear) => (
          <Button variant="destructive" size="sm"
            onClick={() => bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })}>
            <Trash2 /> Delete
          </Button>)}
      />
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} destructive
        title="Delete customer?" onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} />
    </div>
  );
}
```

### 5. Form (create/edit) — shared component + two thin pages

- `src/features/customers/CustomerForm.jsx` — RHF + `zodResolver`, uses `FormInput/FormSelect/FormTextarea/FormNumber/FormDatePicker` from `@/components/forms/fields` inside a `Card`, grid `sm:grid-cols-2`.
- `src/app/(dashboard)/customers/new/page.jsx` → `<CustomerForm />` + `useCreate()`, on success `router.push("/customers")`.
- `src/app/(dashboard)/customers/[id]/edit/page.jsx` → `useDetail(id)` (unwrap `useParams()`), pass `defaultValues`, `useUpdate()`.
- In `[id]` pages: `const { id } = useParams();`

### 6. Detail page — `src/app/(dashboard)/customers/[id]/page.jsx`

Header card (avatar/name/badges/quick actions) + `<Tabs>`: Overview / Timeline (via `useSub(id, "timeline")`) / related lists / Notes / Files. Loading via `<LoadingSpinner />` or `Skeleton`, errors via `<ErrorState error={error} onRetry={refetch} />`.

### 7. CSV import (where required)

`parseCsvFile(file)` from `@/utils/export` inside a `Dialog` with a file input, then loop `create.mutateAsync` (cap at ~100 rows) and toast a summary.

## Kanban boards (leads, tasks)

Use `@dnd-kit/core` + `@dnd-kit/sortable` (installed). Columns from the stage/status option lists; on drop call `hooks.usePatch().mutate({ id, stage })` (optimistic update built-in). Give each column a droppable id equal to the stage value. Show value totals per column where money is involved.

## Calendar

`@fullcalendar/react` + daygrid/timegrid/list/interaction plugins. Import FullCalendar with `next/dynamic` and `ssr: false`. Theme bridge CSS already exists in `globals.css` (`.fc` vars).

## PDF (quotes/invoices/reports)

Use `exportToPdf({ title, columns, rows, filename })` from `@/utils/export` for tabular exports. For invoice/quote documents build a styled printable section and lazy-import `jspdf` similarly (or use `window.print()` on a print-friendly area for "PDF preview").

## Role gating

Wrap admin-only UI in `<RoleGate roles={["admin"]}>` (`@/components/common/RoleGate`). Nav visibility is already handled centrally in `constants/nav.js` — do not edit it.

## Tests (only if asked)

Pure logic only (zod schemas, small utils) under `src/validations/__tests__/*.test.js` using vitest globals (`describe/it/expect` via import from "vitest"). No DOM/component tests.

## Style

- Cards: `Card/CardHeader/CardTitle/CardContent`.
- Page root: `<div className="space-y-6">` starting with `<PageHeader …/>`.
- Money right-aligned in tables (`className="text-right tabular-nums"` on cells).
- Empty states via `<EmptyState />`; never render a bare "no data" string.
- Keep everything responsive: grids collapse (`grid gap-4 sm:grid-cols-2 xl:grid-cols-4`), tables already scroll horizontally.
