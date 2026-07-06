# Component Reference

## UI primitives — `src/components/ui/`

shadcn/ui-style primitives (JSX, Radix under the hood, themed via CSS variables in `globals.css`):
`button` (variants: default/destructive/outline/secondary/ghost/link/success; `loading` prop; `asChild`), `input`, `textarea`, `label`, `card`, `badge`, `avatar`, `skeleton`, `separator`, `table`, `tabs`, `dialog`, `alert-dialog`, `dropdown-menu`, `select`, `checkbox`, `switch`, `tooltip`, `popover`, `sheet`, `scroll-area`, `progress`.

## Common — `src/components/common/`

| Component | Purpose |
|---|---|
| `PageHeader` | Title + description + actions row (animated) — first child of every page |
| `StatCard` | KPI tile with icon, delta arrow and skeleton state |
| `StatusBadge` | Colored chip driven by option lists from `constants/options.js` |
| `EmptyState` / `ErrorState` / `LoadingSpinner` | Consistent empty/error/loading blocks |
| `ConfirmDialog` | Controlled destructive-action confirmation |
| `ErrorBoundary` | Class boundary with retry; wraps the app and each chart |
| `UserAvatar` | Avatar with initials fallback |
| `RoleGate` | RBAC visibility gate (`roles` / `permission` props) |
| `ThemeProvider` | Applies persisted light/dark/system theme |

## Forms — `src/components/forms/`

`fields.jsx` exports RHF-ready wrappers: `FormInput`, `FormTextarea`, `FormSelect`, `FormCheckbox`, `FormSwitch`, `FormDatePicker`, `FormNumber`, plus `FieldWrapper`. Pass `register`/`control`, `name`, `label`, `error`.

`DynamicForm.jsx` renders an entire zod-validated form from a JSON field config — used for quick CRUD dialogs.

## Tables — `src/components/tables/DataTable.jsx`

Server-driven TanStack Table with: debounced search, filter slot, sorting, pagination + page-size select, column visibility menu, row selection + bulk-action bar, CSV-export-friendly `actions` slot, loading skeletons, error + empty states, row click navigation. Pair with `useTableState()`:

```jsx
const t = useTableState();
const { data, isPending, error, refetch } = hooks.useList(t.queryParams);
<DataTable columns={columns} data={data?.items ?? []} loading={isPending}
  error={error} onRetry={refetch} pageCount={data?.totalPages} total={data?.total}
  {...t.tableProps} enableRowSelection />
```

`selectionColumn` is exported for checkbox selection.

## Charts — `src/components/charts/`

`ChartCard` (shell with loading + error boundary), `SalesAreaChart`, `PipelineBarChart`, `FunnelBarChart`, `DonutChart`, all themed via `chartTheme.js` CSS-variable tokens so they adapt to dark mode automatically.

## Layout — `src/components/layout/`

`Sidebar` (collapsible, role-filtered from `constants/nav.js`, mobile sheet), `Navbar` (breadcrumbs, global search ⌘K, theme switcher, notification bell, user menu), `NotificationPanel` (realtime sheet), `GlobalSearch` (cross-entity instant search dialog), `Breadcrumbs`, `Footer`.

## State

- **Zustand** (`src/store/`): `auth.store` (user, RBAC helpers, persisted), `theme.store`, `notification.store`, `ui.store` (sidebar/command palette), `settings.store` (currency/locale).
- **React Query**: all server state via `createCrudHooks` — lists (`keepPreviousData`), details, optimistic `usePatch` (kanban drags), toast-wrapped mutations with automatic invalidation.
