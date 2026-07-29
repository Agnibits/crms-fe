"use client";

import { AlertTriangle, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/services/api";
import { titleCase } from "@/utils/format";

/** "customer:read" → "Customer · View" (best-effort, no catalog dependency). */
function humanizePermission(code) {
  const [entity, action] = String(code).split(":");
  const entityLabel = titleCase(String(entity || "").replace(/_/g, " "));
  const actionLabel = action === "read" ? "View" : titleCase(action || "");
  return actionLabel ? `${entityLabel} · ${actionLabel}` : entityLabel;
}

/**
 * Inline state for a failed query. A 403 is an intentional access restriction,
 * not a failure — it gets its own calmer "restricted" treatment (no Retry, since
 * retrying can't grant access), while everything else keeps the error + retry.
 */
export default function ErrorState({ error, onRetry, title = "Failed to load data" }) {
  const status = error?.response?.status ?? error?.status;

  if (status === 403) {
    const required = (getErrorMessage(error).match(/[a-z_]+:[a-z_]+/g) || [])
      .map(humanizePermission)
      .join(", ");
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
          <Lock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium">Access restricted</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You don&apos;t have permission to view this. Ask an administrator to grant you access.
          </p>
          {required && (
            <p className="mt-2 text-xs text-muted-foreground">
              Requires <span className="font-medium text-foreground">{required}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}
