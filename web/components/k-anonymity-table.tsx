import { Check, X } from "lucide-react";

/*
  k-anonymity minimum: any metric derived from fewer than 3 clients
  is suppressed and never shown. This protects any individual client
  from being identified by their data.
*/
const K_MIN = 3;

type InsightItem = { platform: string; client_count: number };

type Props = {
  insights: {
    avg_ctr_by_platform: InsightItem[];
    cpm_ranges_by_platform: InsightItem[];
    spend_share_by_platform: InsightItem[];
  };
};

type Row = {
  insight: string;
  segment: string;
  clients: number;
  status: "Published" | "Suppressed";
};

/*
  KAnonymityTable is the privacy audit log. It shows every aggregated
  insight that was computed, how many clients contributed to it, and
  whether it passed the k=3 threshold required for publication.

  This makes the privacy protection auditable and transparent.
  Aidan or any stakeholder can verify that no insight is derived
  from fewer than 3 clients.
*/
export default function KAnonymityTable({ insights }: Props) {
  /* Build one row per insight type per platform */
  const rows: Row[] = [];

  insights.avg_ctr_by_platform.forEach(i =>
    rows.push({
      insight: "Avg CTR",
      segment: i.platform,
      clients: i.client_count,
      status: i.client_count >= K_MIN ? "Published" : "Suppressed",
    })
  );

  insights.cpm_ranges_by_platform.forEach(i =>
    rows.push({
      insight: "CPM Ranges",
      segment: i.platform,
      clients: i.client_count,
      status: i.client_count >= K_MIN ? "Published" : "Suppressed",
    })
  );

  insights.spend_share_by_platform.forEach(i =>
    rows.push({
      insight: "Spend Share",
      segment: i.platform,
      clients: i.client_count,
      status: i.client_count >= K_MIN ? "Published" : "Suppressed",
    })
  );

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left  px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">Insight Type</th>
            <th className="text-left  px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">Platform Segment</th>
            <th className="text-right px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">Clients Contributing</th>
            <th className="text-left  px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">K-Threshold (need 3 or more)</th>
            <th className="text-left  px-5 py-3.5 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`${i !== rows.length - 1 ? "border-b border-border" : ""} hover:bg-muted/30 transition-colors`}
            >
              {/* Insight type shown in monospace since it is a metric name */}
              <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.insight}</td>
              <td className="px-5 py-3 text-foreground font-medium">{r.segment}</td>
              <td className="px-5 py-3 text-right text-foreground tabular-nums font-semibold">{r.clients}</td>

              {/* Pass or fail icon showing whether the k threshold was met */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                  {r.status === "Published" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Pass</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs text-rose-500 font-medium">Fail</span>
                    </>
                  )}
                </div>
              </td>

              {/* Badge showing the final publication status */}
              <td className="px-5 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  r.status === "Published"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                }`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

