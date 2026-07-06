"use client";

import { useState } from "react";
import { Check, FolderOpen, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { productCategoryHooks } from "@/features/products/hooks";

/**
 * Manage product categories (list / add / rename / delete) inside a dialog.
 *   <CategoriesDialog open={open} onOpenChange={setOpen} />
 */
export default function CategoriesDialog({ open, onOpenChange }) {
  const { data, isPending, error, refetch } = productCategoryHooks.useList(
    { page: 1, limit: 100 },
    { enabled: open }
  );
  const create = productCategoryHooks.useCreate();
  const update = productCategoryHooks.useUpdate();
  const remove = productCategoryHooks.useRemove();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const categories = data?.items ?? [];

  const handleAdd = () => {
    const name = newName.trim();
    if (name.length < 2) return;
    create.mutate(
      { name, description: "", productCount: 0 },
      { onSuccess: () => setNewName("") }
    );
  };

  const startRename = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleRename = () => {
    const name = editingName.trim();
    if (!editingId || name.length < 2) return;
    update.mutate(
      { id: editingId, name },
      { onSuccess: () => { setEditingId(null); setEditingName(""); } }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Product categories</DialogTitle>
            <DialogDescription>
              Organize your catalog — add, rename or remove categories.
            </DialogDescription>
          </DialogHeader>

          {/* Add new */}
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="New category name"
              aria-label="New category name"
            />
            <Button
              onClick={handleAdd}
              disabled={create.isPending || newName.trim().length < 2}
              aria-label="Add category"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>

          {/* List */}
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : isPending ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)
            ) : categories.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No categories yet"
                description="Add your first category above."
                className="py-8"
              />
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  {editingId === category.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        className="h-8"
                        autoFocus
                        aria-label="Category name"
                      />
                      <Button
                        size="icon-sm"
                        onClick={handleRename}
                        disabled={update.isPending || editingName.trim().length < 2}
                        aria-label="Save name"
                      >
                        {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel rename"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{category.name}</p>
                        {category.description && (
                          <p className="truncate text-xs text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        {category.productCount ?? 0} items
                      </Badge>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startRename(category)}
                          aria-label={`Rename ${category.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(category.id)}
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete category?"
        description="Products in this category keep their data but lose the category link."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </>
  );
}
