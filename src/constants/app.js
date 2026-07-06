export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AgniBits CRM";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
// Mock mode is a development/demo convenience served by the in-browser adapter.
// It is hard-disabled in production builds so a stray NEXT_PUBLIC_USE_MOCK=true
// can never ship seeded demo data to real users — production always hits the API.
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" && process.env.NODE_ENV !== "production";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_CURRENCY = "USD";

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
