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
import ChartEmpty from "./ChartEmpty";
import { formatCompactCurrency } from "@/utils/format";

/** Deal value by pipeline stage. Data: [{ stage, value, count }] */
export default function PipelineBarChart({ data = [] }) {
  const hasValue = data.some((d) => Number(d.value) > 0);
  if (!data.length || !hasValue) {
    return <ChartEmpty message="No open deal value yet — add deals to see your pipeline here." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        {/* Stage names are long ("Closed Won"); angle them so they never collide. */}
        <XAxis
          dataKey="stage"
          {...axisProps}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={64}
          tickMargin={4}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          {...axisProps}
          tickFormatter={(v) => formatCompactCurrency(v)}
          width={64}
          allowDecimals={false}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => (name === "Value" ? formatCompactCurrency(value) : value)}
        />
        <Bar dataKey="value" name="Value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
