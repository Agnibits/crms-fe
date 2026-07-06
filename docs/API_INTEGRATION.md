# API Integration Guide

## Base client — `src/services/api.js`

A single axios instance with:

- **Auth interceptor** — attaches `Authorization: Bearer <accessToken>` from cookie storage on every request.
- **Auto token refresh** — on a 401 (outside auth endpoints) the client POSTs `/auth/refresh-token` with the stored refresh token. Concurrent 401s are queued behind one refresh; on success every queued request replays with the new token, on failure the session is cleared and the user is redirected to `/login`.
- **Retry logic** — idempotent GETs retry up to 2× with exponential backoff on network errors and 502/503/504.
- **Cancellation** — every service method accepts `{ signal }`; React Query passes its `AbortSignal` automatically, so switching pages/filters aborts in-flight requests. For imperative use, `withCancel()` returns `{ signal, cancel }`.
- **Error handling** — `getErrorMessage(error)` normalizes API error bodies, timeouts and network failures; `toastError(error)` shows them (and stays silent for cancelled requests).

## Response contract

```jsonc
// single resource
{ "success": true, "message": "OK", "data": { ... } }

// list
{ "success": true, "data": { "items": [...], "page": 1, "limit": 10, "total": 143, "totalPages": 15 } }
```

`unwrap(response)` returns `data`. List query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`, plus arbitrary filter keys (`status`, `stage`, …).

## Endpoints

All paths are registered in `src/constants/endpoints.js` — one place to align with the backend. Auth flow endpoints: `/auth/login`, `/auth/register`, `/auth/refresh-token`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/change-password`, `/auth/me`, `/auth/profile`, `/auth/avatar` (multipart).

## Adding a module service

```js
import { createCrudService } from "./crud.factory";
import { ENDPOINTS } from "@/constants/endpoints";

export const widgetService = {
  ...createCrudService("/widgets"),
  publish: (id) => createCrudService("/widgets").action(id, "publish"),
};
```

`createCrudService` provides `list`, `getById`, `create`, `update`, `patch`, `remove`, `bulkRemove`, `sub(id, path)` (GET sub-resource) and `action(id, path, payload)` (POST action).

Pair it with `createCrudHooks` (`src/hooks/useCrud.js`) for cached queries, optimistic patches and toast-wrapped mutations.

## Mock mode

`NEXT_PUBLIC_USE_MOCK=true` swaps the axios adapter for `src/services/mock/mockAdapter.js`, which serves the full contract (auth, dashboard aggregations, generic collection CRUD with search/sort/filter/pagination, sub-resources, reports, settings, global search) from the seeded dataset in `src/services/mock/db.js`. Mutations persist in memory until reload. This is for demos and frontend development only — it is code-split away from real API traffic and disabled by default in the Docker image.

## Realtime

`src/services/socket.js` connects socket.io with the JWT in the `auth` payload and listens for `notification` events; `useNotifications()` wires it to the Zustand store and toasts. In mock mode a timer emits demo notifications instead.
