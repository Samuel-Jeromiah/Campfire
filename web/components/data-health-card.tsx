import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

type Health = {
  total_rows: number;
  clean_rows: number;
  flagged_rows: number;
  pct_flagged: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  flag_breakdown: Array<{ flag_type: string; count: number }>;
};

/*
  Visual styles for each possible health status.
  HEALTHY = green (less than 5% of rows flagged).
  WARNING = amber (5 to 15% flagged).
  CRITICAL = red (more than 15% flagged).
*/
const STATUS_STYLES = {
  HEALTHY:  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    icon: CheckCircle2,
  },
  WARNING:  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-500",
    icon: AlertCircle,
  },
  CRITICAL: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    bar: "bg-rose-500",
    icon: XCircle,
  },
};

/*
  Friendly labels that translate the internal flag type codes into
  plain English descriptions a non-technical person can understand.
*/
const FLAG_LABELS: Record<string, string> = {
  "missing_date":               "Missing date field",
  "missing_impressions":        "Missing impression count",
  "missing_clicks":             "Missing click count",
  "missing_spend_usd":          "Missing spend amount",
  "clicks_exceed_impressions":  "Clicks exceed impressions",
  "negative_spend":             "Negative spend value",
  "negative_impressions":       "Negative impression count",
  "cpm_spike_outlier":          "CPM spike (5x rolling avg)",
  "duplicate_row":              "Duplicate campaign row",
};

/*
  DataHealthCard summarizes the quality of the unified ad dataset
  after all 5 automated error checks have been run. It shows the
  overall status, row counts, and a breakdown of which specific
  errors were found.
*/
export default function DataHealthCard({ health }: { health: Health }) {
  const style = STATUS_STYLES[health.status];
  const Icon = style.icon;

  /* What fraction of rows are clean (between 0 and 1) */
  const cleanFraction = health.clean_rows / health.total_rows;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Card 1: Overall status and percentage flagged */}
      <div className={`surface-card ${style.bg} ${style.border} rounded-xl p-6 flex flex-col`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-4 h-4 ${style.text}`} />
          <span className={`text-xs uppercase tracking-widest font-semibold ${style.text}`}>
            {health.status}
          </span>
        </div>

        {/* Big percentage number */}
        <div className={`text-4xl font-bold tracking-tight ${style.text}`}>
          {health.pct_flagged.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          of rows have quality issues
        </div>

        {/* Visual progress bar: green portion = clean rows */}
        <div className="mt-5 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${cleanFraction * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>{(cleanFraction * 100).toFixed(1)}% clean</span>
          <span>{health.pct_flagged.toFixed(1)}% flagged</span>
        </div>

        {/* Threshold guide so the reader knows what the status means */}
        <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Healthy: below 5%. Warning: 5-15%. Critical: above 15%.
        </div>
      </div>

      {/* Card 2: Raw row counts */}
      <div className="surface-card rounded-xl p-6 flex flex-col">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-5">
          Row Counts
        </div>
        <div className="space-y-4 flex-1">
          <StatRow label="Total input rows"   value={health.total_rows.toLocaleString()}   color="text-foreground"      />
          <StatRow label="Passed all checks"  value={health.clean_rows.toLocaleString()}   color="text-emerald-600"     />
          <StatRow label="Failed one or more" value={health.flagged_rows.toLocaleString()} color="text-amber-600"       />
        </div>
        <div className="mt-5 text-xs text-muted-foreground leading-relaxed">
          Flagged rows are kept in a separate file for review. They are not used in downstream calculations.
        </div>
      </div>

      {/* Card 3: Breakdown of which error types were found */}
      <div className="surface-card rounded-xl p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Error Types Found
        </div>
        <div className="space-y-2.5">
          {health.flag_breakdown.slice(0, 6).map((f) => (
            <div key={f.flag_type} className="flex items-center justify-between gap-3">
              {/* Show a friendly label if we have one, otherwise show the raw code */}
              <span className="text-xs text-muted-foreground truncate">
                {FLAG_LABELS[f.flag_type] ?? f.flag_type}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">
                {f.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
  A single labeled stat row used inside the row counts card.
  Shows a label on the left and a colored number on the right.
*/
function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

