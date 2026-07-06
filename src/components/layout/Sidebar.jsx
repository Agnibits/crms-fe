"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navForRole } from "@/constants/nav";
import { APP_NAME } from "@/constants/app";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { cn } from "@/utils/cn";

function NavLink({ item, collapsed, onNavigate }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarBody({ collapsed = false, onNavigate }) {
  const role = useAuthStore((s) => s.user?.role);
  const sections = navForRole(role);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2 px-4", collapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        {!collapsed && <span className="truncate text-base font-semibold">{APP_NAME}</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:block",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarBody collapsed={sidebarCollapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-foreground cursor-pointer"
        >
          <ChevronsLeft className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarBody onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
