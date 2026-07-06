"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, tooltipStyle } from "./chartTheme";

/**
 * Generic donut chart. Data: [{ name, value }]
 * Optional centerLabel renders in the middle of the donut.
 */
export default function DonutChart({ data = [], centerLabel }) {
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="85%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
          <div className="text-center">
            <p className="text-xl font-semibold">{centerLabel.value}</p>
            <p className="text-xs text-muted-foreground">{centerLabel.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
