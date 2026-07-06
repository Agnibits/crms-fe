# AgniBits CRM — Sales Automation Frontend

Enterprise-grade CRM + Sales Automation frontend built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4** and a hand-rolled **shadcn/ui**-style component kit. It integrates with a Node.js/Express + PostgreSQL/Prisma REST API secured by JWT, and ships with a full in-browser **demo mode** so every screen works without a backend.

## ✨ Feature highlights

- **Auth**: login, register, forgot/reset password, email verification, change password, profile + avatar, JWT with auto refresh (queued), protected routes via Next middleware, RBAC (roles + permissions)
- **Dashboard**: KPI cards, monthly sales vs target, sales funnel, pipeline overview, deals donut, conversion/win-rate meters, recent activities, upcoming tasks
- **CRM**: customers (timeline, related contacts/deals/invoices/files/notes, CSV import/export), contacts, leads (list + drag-and-drop kanban, assign, convert, merge duplicates), opportunities (pipeline + weighted forecast), deals (board + history)
- **Sales**: products & categories & inventory, quote builder with live totals + PDF, sales orders with status flow, invoices with PDF/email/payment history, payments with record-payment dialog
- **Work**: task board (dnd) + task calendar, activity timeline (calls/meetings/emails/notes/WhatsApp/SMS), FullCalendar with events/tasks/follow-ups
- **Engage**: email & SMS campaign builder with previews and metrics, support tickets with chat thread, file manager, realtime notification center (socket.io)
- **Admin**: reports (revenue/customers/leads/sales/products/employees with CSV/Excel/PDF export), user management, roles & permissions matrix, company settings (branches, departments, teams, email, SMS, tax, currency, appearance)

## 🚀 Getting started

```bash
# 1. Install dependencies (Node 20+)
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run the dev server
npm run dev
# → http://localhost:3000
```

**Demo mode is on by default** (`NEXT_PUBLIC_USE_MOCK=true`): every API call is served by an in-browser mock adapter with seeded data. Log in with the prefilled credentials (any email/password works). Set it to `false` to hit your real API.

## 🔧 Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | REST API base URL | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server for realtime notifications | `http://localhost:5000` |
| `NEXT_PUBLIC_APP_NAME` | Product name shown in the UI | `AgniBits CRM` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |
| `NEXT_PUBLIC_USE_MOCK` | `true` → in-browser demo data, no backend needed | `true` |

## 📁 Project structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # login, register, forgot/reset password, verify email
│   └── (dashboard)/      # all protected pages (sidebar/navbar shell)
├── components/
│   ├── ui/               # shadcn-style primitives (button, dialog, table…)
│   ├── layout/           # Sidebar, Navbar, NotificationPanel, GlobalSearch…
│   ├── forms/            # RHF field wrappers + DynamicForm builder
│   ├── tables/           # DataTable (TanStack Table, server-driven)
│   ├── charts/           # Recharts wrappers themed via CSS variables
│   ├── modals/           # (feature modals live in features/*)
│   └── common/           # PageHeader, StatCard, StatusBadge, ErrorBoundary…
├── features/<module>/    # module hooks + module-specific components
├── hooks/                # useCrud (React Query factory), useTableState…
├── services/             # axios client, interceptors, per-module services, mock/
├── store/                # Zustand: auth, theme, notifications, ui, settings
├── utils/                # cn, format, export (CSV/Excel/PDF), storage
├── validations/          # zod schemas per module
├── constants/            # endpoints, nav, roles/permissions, option lists
├── layouts/              # AuthLayout, DashboardLayout
└── middleware.js         # edge route protection
```

## 🧪 Testing

```bash
npm test          # vitest run
npm run test:watch
```

Unit tests cover utilities, zod schemas and stores (`src/**/__tests__`).

## 🐳 Docker

```bash
docker compose up --build
# or
docker build -t crm-frontend --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 .
docker run -p 3000:3000 crm-frontend
```

The image is a multi-stage build producing Next.js standalone output (~150 MB, non-root user).

## ☁️ Deployment

- **Vercel**: zero-config — set the env vars in project settings.
- **Any Node host**: `npm run build && npm start`.
- **Docker/K8s**: use the provided Dockerfile; front it with your ingress/UI CDN of choice.

## 📚 Further docs

- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — module recipe & coding standards
- [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) — API contract, interceptors, token refresh
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — reusable component reference

## 🔐 Security notes

- Access/refresh tokens are stored in `SameSite=Strict` cookies so the Next middleware can guard routes; swap to httpOnly cookies set by your API for production hardening (the axios layer already tolerates both).
- All forms are zod-validated; React escapes output by default (no `dangerouslySetInnerHTML` anywhere).
- Role-based UI gating via `<RoleGate>` + centrally filtered navigation; enforce the same rules server-side in your API.
