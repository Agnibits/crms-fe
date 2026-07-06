"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
