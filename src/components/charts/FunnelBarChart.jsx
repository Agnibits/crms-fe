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

/** Horizontal sales funnel. Data: [{ stage, count }] */
export default function FunnelBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axisProps} />
        <YAxis type="category" dataKey="stage" {...axisProps} width={92} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
