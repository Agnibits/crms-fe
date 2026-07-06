export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SALES: "sales",
  SUPPORT: "support",
  USER: "user",
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.MANAGER]: "Sales Manager",
  [ROLES.SALES]: "Sales Rep",
  [ROLES.SUPPORT]: "Support Agent",
  [ROLES.USER]: "User",
};

/**
 * Backend Role enum. SUPER_ADMIN is **reserved** — there is exactly one on the
 * platform and it can never be assigned through the API, so it is never offered
 * in a role picker. The highest role an admin can grant is ADMIN.
 */
export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export const BACKEND_ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  MANAGER: "Manager",
  SALES_MANAGER: "Sales Manager",
  SALES_EXECUTIVE: "Sales Executive",
  MARKETING: "Marketing",
  CUSTOMER_SUPPORT: "Customer Support",
  USER: "User",
};

/** The 7 roles an admin may assign (SUPER_ADMIN deliberately excluded). */
export const ASSIGNABLE_ROLES = [
  "ADMIN",
  "MANAGER",
  "SALES_MANAGER",
  "SALES_EXECUTIVE",
  "MARKETING",
  "CUSTOMER_SUPPORT",
  "USER",
].map((value) => ({ value, label: BACKEND_ROLE_LABELS[value] }));

export const ASSIGNABLE_ROLE_VALUES = ASSIGNABLE_ROLES.map((r) => r.value);

/** Fine-grained permissions used for RBAC checks (mirrors API permissions). */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_MANAGE: "customer:manage",
  LEAD_VIEW: "lead:view",
  LEAD_MANAGE: "lead:manage",
  DEAL_VIEW: "deal:view",
  DEAL_MANAGE: "deal:manage",
  INVOICE_VIEW: "invoice:view",
  INVOICE_MANAGE: "invoice:manage",
  REPORT_VIEW: "report:view",
  USER_MANAGE: "user:manage",
  SETTINGS_MANAGE: "settings:manage",
};

/** Default permission sets per role (fallback when API doesn't send them). */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: Object.values(PERMISSIONS).filter(
    (p) => ![PERMISSIONS.USER_MANAGE, PERMISSIONS.SETTINGS_MANAGE].includes(p)
  ),
  [ROLES.SALES]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_MANAGE,
    PERMISSIONS.DEAL_VIEW,
    PERMISSIONS.DEAL_MANAGE,
    PERMISSIONS.INVOICE_VIEW,
  ],
  [ROLES.SUPPORT]: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.CUSTOMER_VIEW],
  [ROLES.USER]: [PERMISSIONS.DASHBOARD_VIEW],
};
