type Props = {
  data: Array<{
    platform: string;
    cpm_min: number;
    cpm_p25: number;
    cpm_median: number;
    cpm_p75: number;
    cpm_max: number;
    client_count: number;
  }>;
};

/*
  A consistent color for each platform, used across all charts in the app.
*/
const PLATFORM_COLORS: Record<string, string> = {
  "Meta Ads":   "#FF5656",
  "Google Ads": "#FF8A56",
  "TikTok Ads": "#F472B6",
};

/*
  CPMRanges visualizes the spread of CPM (cost per 1,000 impressions) for
  each platform. Instead of just showing one average number, it shows the
  full distribution: minimum, 25th percentile, median, 75th percentile, maximum.
  This reveals how predictable or volatile the pricing is.

  Each platform shows three visual layers on a bar:
  - A thin horizontal line stretching from min to max (the total possible range)
  - A wider colored box from the 25th to 75th percentile (where most values fall)
  - A solid vertical marker at the exact median (the middle value)
*/
export default function CPMRanges({ data }: Props) {
  /* Find the largest max CPM so all platforms share the same scale */
  const globalMax = Math.max(...data.map(d => d.cpm_max));

  /* Find the cheapest platform (lowest median) for the insight callout */
  const cheapest = [...data].sort((a, b) => a.cpm_median - b.cpm_median)[0];

  return (
    <div className="surface-card rounded-xl p-6">

      {/* Insight callout explaining the key takeaway */}
      <div className="mb-5 p-3 bg-primary/5 rounded-lg border border-primary/15">
        <p className="text-xs text-primary font-medium leading-relaxed">
          {cheapest.platform} has the lowest median CPM at ${cheapest.cpm_median.toFixed(2)}.
          This means it costs less to reach 1,000 people there than on the other platforms.
          A lower CPM is better when the goal is to maximize reach on a fixed budget.
        </p>
      </div>

      {/* One row per platform */}
      <div className="space-y-6">
        {data.map((row) => {
          const color = PLATFORM_COLORS[row.platform] || "#9CA3AF";

          /*
            Convert each CPM value to a percentage of the global max
            so we can position each element at the correct spot in the bar.
          */
          const minPct    = (row.cpm_min    / globalMax) * 100;
          const p25Pct    = (row.cpm_p25    / globalMax) * 100;
          const medianPct = (row.cpm_median / globalMax) * 100;
          const p75Pct    = (row.cpm_p75    / globalMax) * 100;
          const maxPct    = (row.cpm_max    / globalMax) * 100;

          return (
            <div key={row.platform}>

              {/* Platform name and the three key stats on one line */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium text-foreground">{row.platform}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                  <span>min ${row.cpm_min.toFixed(2)}</span>
                  <span className="text-foreground font-semibold">median ${row.cpm_median.toFixed(2)}</span>
                  <span>max ${row.cpm_max.toFixed(2)}</span>
                </div>
              </div>

              {/* The range bar with all three layers stacked inside */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">

                {/* P25 to P75: the box showing where the middle 50% of values land */}
                <div
                  className="absolute h-full rounded-sm opacity-25"
                  style={{
                    left:       `${p25Pct}%`,
                    width:      `${p75Pct - p25Pct}%`,
                    background: color,
                  }}
                />

                {/* Min to max: a thin line showing the full possible range */}
                <div
                  className="absolute h-px top-1/2 opacity-50"
                  style={{
                    left:       `${minPct}%`,
                    width:      `${maxPct - minPct}%`,
                    background: color,
                  }}
                />

                {/* Median marker: a solid vertical bar at the exact middle value */}
                <div
                  className="absolute w-1 h-full rounded-sm"
                  style={{
                    left:       `${medianPct}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend explaining the three visual elements */}
      <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-px bg-gray-400 opacity-60" />
          Full range (min to max)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-2.5 bg-gray-400 opacity-30 rounded" />
          Middle 50% of values (P25 to P75)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1 h-3 bg-gray-500 rounded" />
          Median
        </span>
      </div>
    </div>
  );
}

