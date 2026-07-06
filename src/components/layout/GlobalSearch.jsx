"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Contact, Handshake, Package, Search, Target, Users, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { api, unwrap } from "@/services/api";
import { ENDPOINTS } from "@/constants/endpoints";
import { QUERY_KEYS } from "@/constants/app";
import { useDebounce } from "@/hooks/useDebounce";
import { useUiStore } from "@/store/ui.store";
import { titleCase } from "@/utils/format";

const TYPE_ICONS = {
  customer: Users,
  lead: Target,
  deal: Handshake,
  contact: Contact,
  product: Package,
};

/** Instant cross-entity search (Ctrl/Cmd + K). */
export default function GlobalSearch() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useUiStore();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.search, debounced],
    queryFn: async ({ signal }) =>
      unwrap(await api.get(ENDPOINTS.search, { params: { q: debounced }, signal })),
    enabled: commandOpen && debounced.length >= 2,
    staleTime: 30_000,
  });

  const go = (href) => {
    setCommandOpen(false);
    setQuery("");
    router.push(href);
  };

  const grouped = results.reduce((acc, r) => {
    (acc[r.type] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 w-64 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent md:flex cursor-pointer"
        aria-label="Open global search"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden cursor-pointer"
        aria-label="Open search"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      <Dialog open={commandOpen} onOpenChange={(open) => { setCommandOpen(open); if (!open) setQuery(""); }}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-xl [&>button]:hidden">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, leads, deals, contacts, products…"
              className="h-12 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {debounced.length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search across your CRM.
              </p>
            ) : isFetching ? (
              <LoadingSpinner className="py-8" />
            ) : results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for “{debounced}”.
              </p>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const Icon = TYPE_ICONS[type] || Search;
                return (
                  <div key={type} className="mb-2">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {titleCase(type)}s
                    </p>
                    {items.map((item) => (
                      <button
                        key={`${type}-${item.id}`}
                        type="button"
                        onClick={() => go(item.href)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </span>
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
