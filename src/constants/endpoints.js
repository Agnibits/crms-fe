/**
 * Central registry of REST API endpoints.
 * All paths are relative to NEXT_PUBLIC_API_URL.
 */
export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
    changePassword: "/auth/change-password",
    me: "/auth/profile",
    profile: "/auth/profile",
    avatar: "/auth/avatar",
  },
  dashboard: {
    // Backend serves the whole dashboard from /dashboard/summary; the other
    // widgets map to their dedicated endpoints (see dashboard.service.js).
    summary: "/dashboard/summary",
    stats: "/dashboard/overview",
    salesChart: "/dashboard/monthly-revenue",
    pipeline: "/opportunities/pipeline-view",
    activities: "/dashboard/recent-activities",
    tasks: "/tasks/me",
  },
  customers: "/customers",
  contacts: "/contacts",
  leads: "/leads",
  opportunities: "/opportunities",
  deals: "/deals",
  products: "/products",
  productCategories: "/categories",
  quotes: "/quotes",
  orders: "/orders",
  invoices: "/invoices",
  payments: "/payments",
  tasks: "/tasks",
  activities: "/activities",
  events: "/events",
  campaigns: "/campaigns",
  tickets: "/tickets",
  notifications: "/notifications",
  reports: "/reports",
  users: "/users",
  roles: "/roles",
  permissions: "/roles/permissions",
  // SUPER_ADMIN-only tenant (company) management
  superadmin: {
    companies: "/superadmin/companies",
  },
  files: "/files",
  search: "/search",
  settings: {
    company: "/settings/company",
    branches: "/settings/branches",
    departments: "/settings/departments",
    teams: "/settings/teams",
    email: "/settings/email",
    sms: "/settings/sms",
    tax: "/settings/tax",
    currency: "/settings/currency",
    preferences: "/settings/preferences",
  },
};
