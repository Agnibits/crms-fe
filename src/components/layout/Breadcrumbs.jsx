"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { titleCase } from "@/utils/format";

/** Auto breadcrumbs derived from the URL path. */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const isId = /^\d+$|^[a-z]+-\d+$|^[0-9a-f-]{16,}$/i.test(segment);
    return {
      href,
      label: isId ? "Details" : titleCase(decodeURIComponent(segment)),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
      <Link href="/dashboard" className="flex items-center hover:text-foreground" aria-label="Dashboard">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
