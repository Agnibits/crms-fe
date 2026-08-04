export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AgniBits CRM";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
// Socket.io runs on the API host (no /api/v1 prefix). Derive it from API_URL so
// realtime works without a separate NEXT_PUBLIC_SOCKET_URL env var — otherwise
// it wrongly falls back to localhost in production and the socket never connects.
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/v\d+\/?$/, "");
// Mock mode is a development/demo convenience served by the in-browser adapter.
// It is hard-disabled in production builds so a stray NEXT_PUBLIC_USE_MOCK=true
// can never ship seeded demo data to real users — production always hits the API.
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" && process.env.NODE_ENV !== "production";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Fallback only — records that carry their own `currency` (invoices, quotes,
// orders, payments) are formatted in theirs. Matches Company.currency's default.
export const DEFAULT_CURRENCY = "NPR";

// Nepal's standard VAT. Used to pre-fill new products / ad-hoc line items when
// the company hasn't configured a tax default in Settings → Tax.
export const DEFAULT_TAX_RATE = 13;

export const QUERY_KEYS = {
  auth: ["auth"],
  dashboard: ["dashboard"],
  customers: ["customers"],
  contacts: ["contacts"],
  leads: ["leads"],
  opportunities: ["opportunities"],
  deals: ["deals"],
  products: ["products"],
  productCategories: ["product-categories"],
  quotes: ["quotes"],
  orders: ["orders"],
  invoices: ["invoices"],
  payments: ["payments"],
  tasks: ["tasks"],
  activities: ["activities"],
  events: ["events"],
  campaigns: ["campaigns"],
  tickets: ["tickets"],
  notifications: ["notifications"],
  reports: ["reports"],
  users: ["users"],
  roles: ["roles"],
  files: ["files"],
  settings: ["settings"],
  search: ["search"],
};
