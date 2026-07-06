# Frontend ↔ Backend API Integration

Status of wiring the Next.js frontend (`crmandsalesautomation`) to the real
Express/Prisma backend (`crmandsalesautomation-be`), replacing the in-browser mock.

## How to run

**Backend** (`../crmandsalesautomation-be`):

```bash
npm run db:start     # embedded Postgres on :5432 (keep running)
npm run db:seed      # once — seeds Super Admin + default pipeline/settings
npm run dev          # API on http://localhost:5000  (Swagger: /api-docs)
```

**Frontend**:

```bash
npm run dev          # http://localhost:3000
```

`.env.local` → `NEXT_PUBLIC_USE_MOCK=false` (now the default) points the app at
the real API. Set it back to `true` to use the offline mock.

**Seeded login:** `admin@crm.local` / `Admin@12345`

## The integration pattern

The frontend was built against a permissive mock, so its field names, value
casing and envelope shape differ from the backend. Rather than rewrite every
component, translation happens **at the service boundary**:

- **`src/services/normalize.js`**
  - `normalizeUser` — backend `firstName/lastName/avatarUrl/role:"SUPER_ADMIN"`
    → frontend `name/avatar/role:"admin"`.
  - `normalizeList` — backend `{ data:[…], meta:{ pagination } }`
    → frontend `{ items, page, limit, total, totalPages }`. Also passes the
    mock's already-correct shape through unchanged.
  - `toBackendRole` — reverse role map for writes (user management).
- **`crud.factory.js`** — every list goes through `normalizeList`, so all list
  pages work without touching them.
- **`auth.service.js`** — normalizes the user on login/register/profile; splits
  the single "Name" field into `firstName`/`lastName`; uppercases nothing here.
- **`customer.service.js`** — the **template** for per-module write mapping:
  `toBackend` (allow-list → drops unknown fields, uppercases the status enum)
  and `fromBackend` (company/addressLine/status casing back to the form shape).

## Done & verified (drove it in a headless browser)

- ✅ **Auth** — login, register (`firstName/lastName`), `/auth/profile`,
  `/auth/refresh`, logout. Role mapping drives nav/RBAC.
- ✅ **All list pages load** — `{data, meta.pagination}` → `{items, …}` via
  crud.factory; `limit` clamped to the backend's max of 100.
- ✅ **Dashboard** — rewired to `/dashboard/overview`, `/dashboard/monthly-revenue`,
  `/dashboard/recent-activities`, `/opportunities/pipeline-view`, `/tasks/me`;
  funnel derived from `/dashboard/summary`. Renders with live data.
- ✅ **All CRUD modules mapped** — customer, contact, lead, deal, opportunity,
  product, task, activity, payment, campaign, quote, order, invoice, ticket, user.
  Each service translates fields/enums at the boundary via `crudMap.js`.
- ✅ **Writes verified end-to-end (headless browser + API chain)** — create via the
  real UI form returns 201 for **customer** (incl. dropped `annualRevenue`/`employees`),
  **product, contact, lead, opportunity, deal, campaign, task, activity**; and the
  quote→convert→order→invoice→payment chain plus **user** and **branch** create and
  the **order status PATCH** all return 201/200 against the live API.
- ✅ **Mappers are allow-lists** — each service forwards only backend-valid columns
  (from `be/src/validators/*`), so stray form fields (`categoryName`, `customerName`,
  `annualRevenue`, `userName`, …) never reach Prisma. `patch()` is enum-mapped too.
- ✅ **Customer pickers** — deals & opportunities now use a `customerId` dropdown
  (`useCustomerOptions`) instead of free-text, so the customer relation is saved.
- ✅ **User create** — added the required password field the backend expects.
- ✅ **Settings org create** — branches/departments/teams inject `companyId` (from
  `/organization/companies`) and map fields to real columns (`isHeadOffice`, …).
- ✅ **Calendar** — backed by `/activities` (+ tasks overlay); no more `/events` 404.
- ✅ **Settings** — scalar prefs read `/settings/map` & write `/settings/bulk`;
  branches/departments/teams read `/organization/*`. No more 404s.
- ✅ **Endpoint fixes** — `/auth/refresh` (was `refresh-token`), `me`→`/auth/profile`,
  `product-categories`→`/categories`, `permissions`→`/roles/permissions`,
  quote convert `convert-to-order`→`convert`.

## Key mappings (per `crudMap.js`)

- **Enum casing** — frontend lowercase (`prospect`, `high`, `open`) ↔ backend
  UPPERCASE, with value overrides where they differ: `bank_transfer`/`cheque`→`BANK`,
  `declined`→`REJECTED`, `void`→`CANCELLED`, `social`→`SOCIAL_MEDIA`,
  `closed_won`→`WON`, `shipped`→`PROCESSING`.
- **Field renames** — e.g. customer `contactName`→`company`, `address`→`addressLine`;
  product `price`→`sellingPrice`, `cost`→`costPrice`, `status`→`isActive`;
  lead `ownerId`→`assignedUserId`, `score`→`probability`; task `assigneeId`→
  `assignedUserId`; contact/user `name`→`firstName`/`lastName`; user role via
  `toBackendRole`.
- **Dropped fields** — form fields with no backend column are dropped by the
  allow-list so Prisma never rejects the write (e.g. customer `annualRevenue`/
  `employees`, lead `city`, deal `amount`/`probability`, campaign `audience`).

## Backend-dev action items

These need a change on the **backend** (`crmandsalesautomation-be`) — the frontend
already works around what it can:

1. **SMTP config** — `.env` mail creds are placeholders, so `POST /auth/register`
   returns `success:false` (the user **is** created; only the verification email
   fails). Set real SMTP, and/or make register tolerate a mail-send failure so it
   reports success.
2. **`POST /tickets/:id/messages`** — the ticket reply thread posts here; the
   endpoint doesn't exist. Add it (or back replies with comments).
3. **Data-model gaps** (only if the business wants these persisted — currently
   dropped by the frontend allow-lists so writes don't 500):
   - customer `annualRevenue`, `employees`
   - deal `amount`, `probability`, `expectedCloseDate` (deals carry only line-item money)
   - department `head`/headcount, team member list
   - product category is optional now (backend already allows null `categoryId`)
4. **Enum taxonomy** (optional) — frontend offers payment `cheque`/`other` and order
   `pending`/`shipped`/`delivered`; the frontend maps these onto the existing
   backend enums (`BANK`/`CASH`, `PROCESSING`/`COMPLETED`). Add real enum values if
   they should be distinct.
5. **Robustness (recommended)** — `BaseController.create/update` forward `req.body`
   straight to Prisma (no `matchedData`/whitelist), so any unexpected field 500s.
   The frontend guards this with per-service allow-lists, but whitelisting on the
   backend (e.g. `matchedData(req)`) would make the API robust on its own.
6. **List `limit` cap** — backend caps `limit` at 100; the frontend clamps to 100.
   Raise the cap only if a page must fetch more than 100 rows per request.
7. **Data** — run `npm run db:seed` (done). Product categories aren't seeded, so the
   product form's category dropdown is empty until some are created (`POST /categories`).

## Multi-tenant (SaaS)
The backend is multi-tenant — data is auto-scoped to the logged-in user's company
from their token. The frontend sends **no** `companyId` and no tenant header; CRM
endpoints are unchanged. A fresh company legitimately shows an empty dashboard.

- **`user.role` + `user.companyId`** come back on login (`normalizeUser` keeps both;
  `rawRole` holds the real backend enum).
- **SUPER_ADMIN** (platform owner, `companyId: null`) additionally gets a **Platform →
  Companies** panel (`/companies`) to onboard/list/suspend/activate tenants. Gated by
  `user.rawRole === "SUPER_ADMIN"` — the nav item (`nav.js` `PLATFORM_SECTION`) and the
  page both check it, so a company ADMIN never sees it.
- **Company onboarding** — `src/services/superadmin.service.js` →
  `POST/GET /superadmin/companies`, `PATCH …/:id/{suspend,activate}`. Create takes the
  company + its first admin; list items carry `_count.users`. (Suspend/activate toggles
  login for all users in the company — there is no company-level status field, so the
  list shows no status badge; both actions are always offered.)
- **Suspended company** → login returns 403 "Account is suspended", surfaced via the
  login toast. **Cross-company access** → 404, handled like any not-found.

Verified end-to-end: SA sees Companies + creates one (201) + suspend blocks its admin's
login; a company ADMIN is denied `/companies`.

## SUPER_ADMIN is reserved
`SUPER_ADMIN` can never be assigned via the API (there is exactly one, already set).
The UI reflects this (`src/constants/roles.js` → `ASSIGNABLE_ROLES`):
- Role pickers (user create/edit) offer only the **7 assignable** roles — ADMIN,
  MANAGER, SALES_MANAGER, SALES_EXECUTIVE, MARKETING, CUSTOMER_SUPPORT, USER.
- The existing super admin is **read-only** in the user list: only "Edit" shows —
  no suspend/deactivate, no delete — and its role field is a read-only "reserved"
  label in the dialog.
- Backend 422 field errors (`errors[].message`) now surface **under the field**
  (`applyFieldErrors` → `setError` in `UserFormDialog`); general messages still toast.

> The `users/roles` page is a client-side permission **matrix demo** (it does not
> assign roles to users) and still lists the 5 simplified RBAC roles.

## Known frontend caveats
- opportunity/deal `stage` name→`stageId` is best-effort against the seeded default
  pipeline; the pipeline board (drag = `move-stage`) remains the primary UX.
