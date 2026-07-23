"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { tagService } from "@/services/tag.service";
import { toastError } from "@/services/api";
import { cn } from "@/utils/cn";

/** Tinted chip style from a tag's hex color. */
function chipStyle(color) {
  const c = color || "#3b82f6";
  return { color: c, borderColor: `${c}55`, backgroundColor: `${c}1a` };
}

/**
 * Assign / create / remove tags on any entity (LEAD | CUSTOMER | DEAL).
 *   <TagEditor entityType="CUSTOMER" entityId={id} />
 */
export default function TagEditor({ entityType, entityId, className }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const entityKey = ["tags", "entity", entityType, entityId];
  const assigned = useQuery({
    queryKey: entityKey,
    queryFn: ({ signal }) => tagService.forEntity(entityType, entityId, { signal }),
    enabled: !!entityId,
  });
  const pool = useQuery({
    queryKey: ["tags", "pool"],
    queryFn: ({ signal }) => tagService.list({ signal }),
    staleTime: 5 * 60 * 1000,
  });

  const assignedTags = assigned.data ?? [];
  const assignedIds = new Set(assignedTags.map((t) => t.id));
  const q = query.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      (pool.data ?? [])
        .filter((t) => !assignedIds.has(t.id) && (!q || t.name.toLowerCase().includes(q)))
        .slice(0, 8),
    [pool.data, assignedIds, q]
  );
  const exactExists = (pool.data ?? []).some((t) => t.name.toLowerCase() === q);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: entityKey });
    queryClient.invalidateQueries({ queryKey: ["tags", "pool"] });
    // The customer/lead/deal record embeds a tag-name list — refresh it too.
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const add = useMutation({
    mutationFn: (tag) => tagService.assign(tag.id, entityType, entityId),
    onSuccess: () => {
      setQuery("");
      invalidate();
    },
    onError: (e) => toastError(e, "Failed to add tag"),
  });

  const createAndAdd = useMutation({
    mutationFn: async (name) => {
      const tag = await tagService.create({ name });
      await tagService.assign(tag.id, entityType, entityId);
    },
    onSuccess: () => {
      setQuery("");
      toast.success("Tag created");
      invalidate();
    },
    onError: (e) => toastError(e, "Failed to create tag"),
  });

  const remove = useMutation({
    mutationFn: (tag) => tagService.unassign(tag.id, entityType, entityId),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "Failed to remove tag"),
  });

  const busy = add.isPending || createAndAdd.isPending;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {assignedTags.map((tag) => (
        <span
          key={tag.id}
          style={chipStyle(tag.color)}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
        >
          {tag.name}
          <button
            type="button"
            aria-label={`Remove ${tag.name}`}
            className="opacity-70 hover:opacity-100"
            onClick={() => remove.mutate(tag)}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Tag
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-2">
          <Input
            autoFocus
            placeholder="Search or create…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q && !exactExists && !busy) {
                e.preventDefault();
                createAndAdd.mutate(query.trim());
              }
            }}
            className="h-8"
          />
          <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                disabled={busy}
                onClick={() => add.mutate(tag)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color || "#3b82f6" }}
                />
                {tag.name}
              </button>
            ))}
            {q && !exactExists && (
              <button
                type="button"
                disabled={busy}
                onClick={() => createAndAdd.mutate(query.trim())}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Create “{query.trim()}”
              </button>
            )}
            {!suggestions.length && !q && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {pool.isPending ? "Loading…" : "Type to create your first tag."}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
