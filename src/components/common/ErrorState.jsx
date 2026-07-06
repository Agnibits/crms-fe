"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/services/api";

/** Inline error block for failed queries, with retry. */
export default function ErrorState({ error, onRetry, title = "Failed to load data" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {getErrorMessage(error)}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}
