"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, tooltipStyle, CHART_COLORS } from "./chartTheme";
import ChartEmpty from "./ChartEmpty";

/** Horizontal sales funnel. Data: [{ stage, count }] */
export default function FunnelBarChart({ data = [] }) {
  const hasValue = data.some((d) => Number(d.count) > 0);
  if (!data.length || !hasValue) {
    return <ChartEmpty message="No leads in the funnel yet — add leads to see stage progression." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        {/* Widened so long stage names ("Closed Lost") aren't truncated. */}
        <YAxis type="category" dataKey="stage" {...axisProps} width={104} tick={{ fontSize: 11 }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
