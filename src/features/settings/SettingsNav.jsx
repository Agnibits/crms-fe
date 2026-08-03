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
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

const SECTIONS = [
  { href: "/settings/company", label: "Company", icon: Building2 },
  { href: "/settings/branches", label: "Branches", icon: MapPin },
  { href: "/settings/departments", label: "Departments", icon: Network },
  // Teams is hidden until it earns its place: a team could be created but no
  // member could be put in one (the user form has no team field), and the team
  // lead was decorative — nothing reads leadUserId. The route, table and API
  // are all still there, so restoring this line is the only step to bring it
  // back. Bring it back when a branch grows large enough that filtering by
  // branch stops being useful, and give it real membership at the same time.
  { href: "/settings/email", label: "Email", icon: Mail },
  { href: "/settings/email-templates", label: "Email Templates", icon: FileText },
  { href: "/settings/sms", label: "SMS", icon: MessageSquare },
  { href: "/settings/tax", label: "Tax", icon: Percent },
  { href: "/settings/currency", label: "Currency", icon: Coins },
  { href: "/settings/targets", label: "Sales Targets", icon: Target },
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
