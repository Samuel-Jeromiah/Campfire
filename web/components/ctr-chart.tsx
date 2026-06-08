"use client";

/*
  This component uses Recharts which requires browser APIs, so it must
  be a client component (the "use client" directive at the top).
*/

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

/*
  A consistent color for each platform, used across all charts in the app.
*/
const PLATFORM_COLORS: Record<string, string> = {
  "Meta Ads":   "#FF5656",
  "Google Ads": "#FF8A56",
  "TikTok Ads": "#F472B6",
};

type Props = {
  data: Array<{ platform: string; avg_ctr_pct: number; client_count: number }>;
};

/*
  CTRChart shows the average Click-Through Rate for each platform as a
  horizontal bar chart. A higher CTR means more people clicked the ad
  compared to how many saw it.
*/
export default function CTRChart({ data }: Props) {
  /* Find the platform with the highest CTR so we can add an insight callout */
  const best = [...data].sort((a, b) => b.avg_ctr_pct - a.avg_ctr_pct)[0];

  return (
    <div className="surface-card rounded-xl p-5">

      {/* Insight callout: one sentence that tells the reader the key takeaway */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/15">
        <span className="text-xs text-primary font-medium leading-relaxed">
          {best.platform} leads with a {best.avg_ctr_pct.toFixed(2)}% average CTR across {best.client_count} clients.
          This means more people are clicking its ads compared to the other platforms.
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 50, left: 0, bottom: 4 }}
        >
          {/* X axis shows percentages (the CTR values) */}
          <XAxis
            type="number"
            stroke="#E5E7EB"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
          />

          {/* Y axis shows the platform names */}
          <YAxis
            type="category"
            dataKey="platform"
            stroke="#E5E7EB"
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
            width={95}
          />

          {/* Tooltip that appears when hovering over a bar */}
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#111111", fontWeight: 600 }}
            formatter={(v) => [`${Number(v).toFixed(2)}%`, "Avg CTR"]}
          />

          {/* The bars, each with a label showing the exact value at the end */}
          <Bar
            dataKey="avg_ctr_pct"
            radius={[0, 6, 6, 0]}
            label={{
              position: "right",
              fill: "#6B7280",
              fontSize: 11,
              formatter: (v: unknown) => `${Number(v).toFixed(2)}%`,
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.platform}
                fill={PLATFORM_COLORS[entry.platform] || "#9CA3AF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
