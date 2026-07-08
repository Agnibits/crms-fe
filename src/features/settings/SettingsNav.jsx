"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Coins,
  Mail,
  FileText,
  MapPin,
  MessageSquare,
  Network,
  Palette,
  Percent,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

const SECTIONS = [
  { href: "/settings/company", label: "Company", icon: Building2 },
  { href: "/settings/branches", label: "Branches", icon: MapPin },
  { href: "/settings/departments", label: "Departments", icon: Network },
  { href: "/settings/teams", label: "Teams", icon: Users },
  { href: "/settings/email", label: "Email", icon: Mail },
  { href: "/settings/email-templates", label: "Email Templates", icon: FileText },
  { href: "/settings/sms", label: "SMS", icon: MessageSquare },
  { href: "/settings/tax", label: "Tax", icon: Percent },
  { href: "/settings/currency", label: "Currency", icon: Coins },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
];

/** Vertical sub-navigation for the settings area. */
export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <Card>
      <CardContent className="p-2">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
