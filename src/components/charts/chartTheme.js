"use client";

/** Shared Recharts styling that follows the app theme. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

export const gridProps = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
  vertical: false,
};

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--popover-foreground)",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
  cursor: { fill: "var(--muted)", opacity: 0.4 },
};
