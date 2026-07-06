import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export default function LoadingSpinner({ className, label = "Loading…", fullPage = false }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        fullPage ? "min-h-[50vh]" : "py-12",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
