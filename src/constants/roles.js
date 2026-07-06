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
