import {
  LayoutDashboard,
  Users,
  Contact,
  Target,
  TrendingUp,
  Handshake,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  CheckSquare,
  PhoneCall,
  CalendarDays,
  Megaphone,
  LifeBuoy,
  BarChart3,
  UserCog,
  Settings,
  FolderOpen,
} from "lucide-react";
import { ROLES } from "./roles";

const { ADMIN, MANAGER, SALES, SUPPORT, USER } = ROLES;

/**
 * Sidebar navigation config. `roles` controls visibility (RBAC).
 * Groups render as section headers.
 */
export const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [ADMIN, MANAGER, SALES, SUPPORT, USER],
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        roles: [ADMIN, MANAGER, SALES, SUPPORT, USER],
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        roles: [ADMIN, MANAGER, SALES, SUPPORT, USER],
      },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Customers", href: "/customers", icon: Users, roles: [ADMIN, MANAGER, SALES, SUPPORT] },
      { label: "Contacts", href: "/contacts", icon: Contact, roles: [ADMIN, MANAGER, SALES, SUPPORT] },
      { label: "Leads", href: "/leads", icon: Target, roles: [ADMIN, MANAGER, SALES] },
      { label: "Opportunities", href: "/opportunities", icon: TrendingUp, roles: [ADMIN, MANAGER, SALES] },
      { label: "Deals", href: "/deals", icon: Handshake, roles: [ADMIN, MANAGER, SALES] },
      { label: "Activities", href: "/activities", icon: PhoneCall, roles: [ADMIN, MANAGER, SALES, SUPPORT] },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Products", href: "/products", icon: Package, roles: [ADMIN, MANAGER, SALES] },
      { label: "Quotes", href: "/quotes", icon: FileText, roles: [ADMIN, MANAGER, SALES] },
      { label: "Orders", href: "/orders", icon: ShoppingCart, roles: [ADMIN, MANAGER, SALES] },
      { label: "Invoices", href: "/invoices", icon: Receipt, roles: [ADMIN, MANAGER, SALES] },
      { label: "Payments", href: "/payments", icon: CreditCard, roles: [ADMIN, MANAGER, SALES] },
    ],
  },
  {
    title: "Engage",
    items: [
      { label: "Marketing", href: "/marketing", icon: Megaphone, roles: [ADMIN, MANAGER] },
      { label: "Support Tickets", href: "/tickets", icon: LifeBuoy, roles: [ADMIN, MANAGER, SUPPORT] },
      { label: "File Manager", href: "/files", icon: FolderOpen, roles: [ADMIN, MANAGER, SALES, SUPPORT] },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, roles: [ADMIN, MANAGER] }],
  },
  {
    title: "Admin",
    items: [
      { label: "User Management", href: "/users", icon: UserCog, roles: [ADMIN] },
      { label: "Settings", href: "/settings", icon: Settings, roles: [ADMIN, MANAGER] },
    ],
  },
];

/** Flat list of all nav items (used by breadcrumbs / command search). */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export function navForRole(role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !role || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
