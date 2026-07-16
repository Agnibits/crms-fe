"use client";

/**
 * Shared Recharts tooltip content.
 *
 * - One readout lists every series at that X, so the pointer never has to land
 *   on a specific line to get a value.
 * - The value leads in strong ink; the series name follows as secondary text —
 *   the reader already has the series and wants the number.
 * - Identity is a short line key in the series colour; text itself never wears
 *   the data colour (a light hue is illegible as text).
 */
export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-xl">
      {label != null && label !== "" && (
        <p className="mb-1.5 text-xs font-semibold text-popover-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ background: entry.color }}
              aria-hidden
            />
            <span className="text-sm font-semibold tabular-nums text-popover-foreground">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
