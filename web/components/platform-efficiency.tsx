type Row = {
  platform: string;
  total_spend: number;
  total_impressions: number;
  total_conversions: number;
  avg_ctr_pct: number;
  avg_cpm: number;
  avg_cpc: number;
  avg_roas: number;
  avg_cpa: number;
};

/*
  A dot color for each platform, shown next to the platform name in the table.
  These colors are consistent across all charts in the app.
*/
const PLATFORM_COLORS: Record<string, string> = {
  "Meta Ads":   "#FF5656",
  "Google Ads": "#FF8A56",
  "TikTok Ads": "#F472B6",
};

/*
  Formats a large number into a short readable form.
  For example: 1500000 becomes "$1.5M", 48000 becomes "48.0K".
*/
function compact(n: number, prefix = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

/*
  Returns a CSS class that colors a cell green, red, or neutral based
  on where that value ranks among all platforms.

  For metrics where higher is better (CTR, ROAS): the highest value
  gets green, the lowest gets red.

  For metrics where lower is better (CPM, CPC, CPA): the lowest value
  gets green, the highest gets red.
*/
function rankClass(value: number, all: number[], higherIsBetter: boolean): string {
  const sorted = [...all].sort((a, b) => higherIsBetter ? b - a : a - b);
  const rank = sorted.indexOf(value);
  if (rank === 0)                  return "text-emerald-600 font-semibold";
  if (rank === sorted.length - 1)  return "text-rose-500";
  return "text-foreground";
}

/*
  PlatformEfficiency shows one row per ad platform with all key efficiency
  metrics side by side. Green = best performer for that metric. Red = worst.
  This makes it easy to scan which platform wins on each dimension.
*/
export default function PlatformEfficiency({ rows }: { rows: Row[] }) {
  /* Pre-collect all values per metric so rankClass can compare them */
  const ctrAll  = rows.map(r => r.avg_ctr_pct);
  const cpmAll  = rows.map(r => r.avg_cpm);
  const cpcAll  = rows.map(r => r.avg_cpc);
  const roasAll = rows.map(r => r.avg_roas);
  const cpaAll  = rows.map(r => r.avg_cpa);

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left  px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Platform</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Spend</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Impressions</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">Conversions</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">CTR</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">CPM</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">CPC</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">ROAS</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-semibold">CPA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.platform}
              className={`${idx !== rows.length - 1 ? "border-b border-border" : ""} hover:bg-muted/30 transition-colors`}
            >
              {/* Platform name with a colored dot */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PLATFORM_COLORS[r.platform] || "#9CA3AF" }} />
                  <span className="font-medium text-foreground">{r.platform}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-right text-foreground tabular-nums">{compact(r.total_spend, "$")}</td>
              <td className="px-5 py-4 text-right text-foreground tabular-nums">{compact(r.total_impressions)}</td>
              <td className="px-5 py-4 text-right text-foreground tabular-nums">{compact(r.total_conversions)}</td>
              {/* Color-coded cells: green = best, red = worst */}
              <td className={`px-5 py-4 text-right tabular-nums ${rankClass(r.avg_ctr_pct, ctrAll,  true)}`}>{r.avg_ctr_pct.toFixed(2)}%</td>
              <td className={`px-5 py-4 text-right tabular-nums ${rankClass(r.avg_cpm,    cpmAll,  false)}`}>${r.avg_cpm.toFixed(2)}</td>
              <td className={`px-5 py-4 text-right tabular-nums ${rankClass(r.avg_cpc,    cpcAll,  false)}`}>${r.avg_cpc.toFixed(2)}</td>
              <td className={`px-5 py-4 text-right tabular-nums ${rankClass(r.avg_roas,   roasAll, true)}`}>{r.avg_roas.toFixed(2)}x</td>
              <td className={`px-5 py-4 text-right tabular-nums ${rankClass(r.avg_cpa,    cpaAll,  false)}`}>${r.avg_cpa.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend explaining what the colors mean */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Best performer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          Worst performer
        </span>
        <span>CTR and ROAS: higher is better. CPM, CPC, CPA: lower is better.</span>
      </div>
    </div>
  );
}
