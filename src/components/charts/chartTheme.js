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

/** Recessive, solid hairline grid. Dashed gridlines read as a threshold/projection. */
export const gridProps = {
  stroke: "var(--border)",
  vertical: false,
};

/** Crosshair for line/area charts — readers aim at a date, not at a 2px line. */
export const lineCursor = {
  stroke: "var(--muted-foreground)",
  strokeWidth: 1,
  strokeOpacity: 0.5,
};

/** Marker spec: >=8px (r>=4) with a 2px surface ring so it stays legible on a line. */
export const activeDotProps = {
  r: 4,
  strokeWidth: 2,
  stroke: "var(--card)",
};

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--popover-foreground)",
    fontSize: "12px",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.35)",
    padding: "8px 10px",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600, marginBottom: "2px" },
  // Recharts sets an inline colour on each tooltip row from the series/slice
  // fill, which overrides contentStyle — pin it to the popover foreground so
  // rows stay readable on every chart (a violet slice was invisible on dark).
  itemStyle: { color: "var(--popover-foreground)" },
  cursor: { fill: "var(--muted)", opacity: 0.4 },
};
