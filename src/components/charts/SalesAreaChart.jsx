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
import { axisProps, gridProps, tooltipStyle } from "./chartTheme";
import { formatCompactCurrency } from "@/utils/format";

/** Monthly revenue vs target area chart. Data: [{ month, revenue, target }] */
export default function SalesAreaChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactCurrency(v)} width={64} />
        <Tooltip {...tooltipStyle} formatter={(value) => formatCompactCurrency(value)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#fillRevenue)"
        />
        <Area
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="var(--chart-3)"
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
