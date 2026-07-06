"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "./Breadcrumbs";
import GlobalSearch from "./GlobalSearch";
import NotificationPanel from "./NotificationPanel";
import ThemeSwitcher from "./ThemeSwitcher";
import UserMenu from "./UserMenu";
import { useUiStore } from "@/store/ui.store";

export default function Navbar() {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        <GlobalSearch />
        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
        <ThemeSwitcher />
        <NotificationPanel />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <UserMenu />
      </div>
    </header>
  );
}
