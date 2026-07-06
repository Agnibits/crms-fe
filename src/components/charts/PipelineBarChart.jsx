"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, gridProps, tooltipStyle } from "./chartTheme";
import { formatCompactCurrency } from "@/utils/format";

/** Deal value by pipeline stage. Data: [{ stage, value, count }] */
export default function PipelineBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="stage" {...axisProps} interval={0} tick={{ fontSize: 11 }} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCompactCurrency(v)} width={64} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => (name === "Value" ? formatCompactCurrency(value) : value)}
        />
        <Bar dataKey="value" name="Value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
