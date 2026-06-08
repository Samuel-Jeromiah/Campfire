/*
  This file replaces the old donut pie chart with a more useful layout.
  Instead of a chart that just shows percentages, we now show three side-by-side
  cards - one per platform - with spend, share percentage, and key metrics.
  This is more readable at a glance and puts all important numbers in one place.
*/

const PLATFORM_COLORS: Record<string, string> = {
  "Meta Ads":   "#FF5656",
  "Google Ads": "#FF8A56",
  "TikTok Ads": "#F472B6",
};

type Props = {
  data: Array<{
    platform: string;
    total_spend: number;
    spend_share_pct: number;
    client_count: number;
  }>;
};

/*
  Formats a dollar amount into a compact readable form.
  For example: 5644016 becomes "$5.6M".
*/
function formatSpend(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/*
  SpendShareChart shows how the total portfolio budget is distributed
  across platforms. The platform with the largest bar is the one
  receiving the most ad spend from all clients combined.
*/
export default function SpendShareChart({ data }: Props) {
  /* Sort by spend descending so the biggest spender is shown first */
  const sorted = [...data].sort((a, b) => b.total_spend - a.total_spend);

  /* The platform with the most spend sets the scale for all bars */
  const maxSpend = sorted[0]?.total_spend ?? 1;

  /* The platform receiving the most budget, used in the insight callout */
  const leader = sorted[0];

  return (
    <div className="surface-card rounded-xl p-5">

      {/* Insight callout explaining the most notable finding */}
      <div className="mb-5 p-3 bg-primary/5 rounded-lg border border-primary/15">
        <span className="text-xs text-primary font-medium leading-relaxed">
          {leader.platform} receives {leader.spend_share_pct.toFixed(1)}% of total portfolio spend,
          making it the dominant channel across all {leader.client_count} clients.
        </span>
      </div>

      {/* One row per platform showing spend bar, amount, and share percentage */}
      <div className="space-y-4">
        {sorted.map((item) => {
          const color = PLATFORM_COLORS[item.platform] || "#9CA3AF";
          /* Width of the bar as a percentage of the widest bar */
          const barWidth = (item.total_spend / maxSpend) * 100;

          return (
            <div key={item.platform}>
              {/* Platform name + dollar amount + percentage on one line */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium text-foreground">{item.platform}</span>
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{formatSpend(item.total_spend)}</span>
                  <span className="text-muted-foreground">{item.spend_share_pct.toFixed(1)}%</span>
                </div>
              </div>

              {/* Colored bar showing the relative size of this platform's spend */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${barWidth}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note explaining the data source */}
      <div className="mt-4 text-xs text-muted-foreground">
        Based on {data[0]?.client_count ?? 0} anonymized clients. All spend figures are aggregated totals for the full 2024 period.
      </div>
    </div>
  );
}

