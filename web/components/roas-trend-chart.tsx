"use client";

/*
  This component uses Recharts which requires browser APIs, so it must
  be a client component (the "use client" directive at the top).
*/

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/*
  Each entry in the monthly_platform_roas array from portfolio_insights.json
  looks like: { month: "2024-01", platform: "Google Ads", avg_roas: 3.923, ... }
*/
type MonthlyRow = {
  month: string;
  platform: string;
  avg_roas: number;
  client_count: number;
};

type Props = {
  data: MonthlyRow[];
};

/*
  Color assigned to each platform's line on the chart.
  These match the colors used in all other charts in the app.
*/
const PLATFORM_COLORS: Record<string, string> = {
  "Meta Ads":   "#FF5656",
  "Google Ads": "#FF8A56",
  "TikTok Ads": "#F472B6",
};

/*
  The full list of platforms we expect to see, used to draw one line per platform.
*/
const PLATFORMS = ["Google Ads", "Meta Ads", "TikTok Ads"];

/*
  Converts a YYYY-MM month string to a short display label like "Jan" or "Sep".
  This keeps the x-axis labels short so they don't overlap.
*/
function shortMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("default", { month: "short" });
}

/*
  ROASTrendChart shows how average ROAS changed month by month for each
  platform throughout 2024. A rising line means the platform is becoming
  more efficient. Crossing lines show when one platform overtook another.

  The data comes from the monthly_platform_roas field in portfolio_insights.json.
  It is already aggregated and k-anonymity verified (each month has 3 clients).
*/
export default function ROASTrendChart({ data }: Props) {
  /*
    Recharts needs data in a "wide" format where each row represents one month
    and each platform is a separate field on that row.

    Input (long format):
      [
        { month: "2024-01", platform: "Google Ads", avg_roas: 3.923 },
        { month: "2024-01", platform: "Meta Ads",   avg_roas: 7.732 },
        ...
      ]

    Output (wide format, what Recharts expects):
      [
        { month: "Jan", "Google Ads": 3.923, "Meta Ads": 7.732, "TikTok Ads": 8.032 },
        { month: "Feb", "Google Ads": 3.869, ... },
        ...
      ]
  */
  const monthMap: Record<string, Record<string, number>> = {};

  data.forEach((row) => {
    if (!monthMap[row.month]) {
      monthMap[row.month] = { month: shortMonth(row.month) };
    }
    monthMap[row.month][row.platform] = row.avg_roas;
  });

  /* Sort months chronologically (they come out of JSON in order but let's be safe) */
  const chartData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);

  /* Find the best month-platform combination to use in the insight callout */
  const bestEntry = data.reduce((best, row) =>
    row.avg_roas > best.avg_roas ? row : best
  );

  return (
    <div className="surface-card rounded-xl p-5">

      {/* Insight callout: the single most important thing to take from this chart */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/15">
        <span className="text-xs text-primary font-medium leading-relaxed">
          {bestEntry.platform} peaked at {bestEntry.avg_roas.toFixed(2)}x ROAS in {shortMonth(bestEntry.month)}.
          All three platforms show ROAS above 3x throughout the year, meaning every dollar spent
          returned at least $3 in revenue on average.
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
        >
          {/* Subtle horizontal grid lines to help read values */}
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />

          {/* X axis: month names along the bottom */}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y axis: ROAS values on the left (shown as "Xx" format) */}
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}x`}
            width={32}
          />

          {/* Tooltip that appears when hovering over a data point */}
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#111111", fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) => [`${Number(value).toFixed(2)}x ROAS`, name as string]}
          />

          {/* Legend at the bottom linking colors to platform names */}
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />

          {/* One line per platform */}
          {PLATFORMS.map((platform) => (
            <Line
              key={platform}
              type="monotone"
              dataKey={platform}
              stroke={PLATFORM_COLORS[platform]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
