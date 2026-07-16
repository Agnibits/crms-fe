"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { activeDotProps, axisProps, gridProps, lineCursor } from "./chartTheme";
import ChartEmpty from "./ChartEmpty";
import ChartTooltip from "./ChartTooltip";
import { formatCompactCurrency } from "@/utils/format";

/** Monthly revenue (vs target when the API provides one). Data: [{ month, revenue, target? }] */
export default function SalesAreaChart({ data = [] }) {
  const hasRevenue = data.some((d) => Number(d.revenue) > 0);
  const hasTarget = data.some((d) => Number(d.target) > 0);

  if (!data.length || (!hasRevenue && !hasTarget)) {
    return <ChartEmpty message="No revenue recorded yet — closed deals and payments will chart here." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {/* A wash, never a saturated block. */}
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} tickMargin={8} minTickGap={16} />
        <YAxis
          {...axisProps}
          tickFormatter={(v) => formatCompactCurrency(v)}
          width={64}
          allowDecimals={false}
        />
        <Tooltip
          cursor={lineCursor}
          content={<ChartTooltip formatter={(v) => formatCompactCurrency(v)} />}
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#fillRevenue)"
          activeDot={{ ...activeDotProps, fill: "var(--chart-1)" }}
        />
        {/* Only plot a target when the API actually sends one — otherwise the
            legend would advertise a series that never renders. Dashed keeps
            "planned" visually distinct from "actual". */}
        {hasTarget && (
          <Area
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="var(--chart-3)"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
            fill="transparent"
            activeDot={{ ...activeDotProps, fill: "var(--chart-3)" }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
