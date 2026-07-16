"use client";

/**
 * Shown instead of a chart when there is nothing to plot.
 * An axis of $0–$4 drawn from all-zero data reads as broken, not as "empty".
 */
export default function ChartEmpty({ message = "No data to show yet." }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
