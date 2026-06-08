import { DollarSign, Eye, MousePointer, Target, TrendingUp } from "lucide-react";

type Props = {
  kpis: {
    total_spend: number;
    total_impressions: number;
    avg_ctr_pct: number;
    total_conversions: number;
    avg_roas: number;
  };
};

/*
  Formats a large number into a short readable form.
  For example: 1500000 becomes "$1.5M", 48000 becomes "$48.0K".
  The prefix argument adds a symbol like "$" before the number.
*/
function formatCompact(n: number, prefix = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

/*
  KPICards shows the five most important top-level numbers for the
  unified ad dataset. Each number is displayed in its own card with
  an icon and label.
*/
export default function KPICards({ kpis }: Props) {
  const items = [
    { label: "Total Spend",   value: formatCompact(kpis.total_spend, "$"),    icon: DollarSign   },
    { label: "Impressions",   value: formatCompact(kpis.total_impressions),   icon: Eye          },
    { label: "Avg CTR",       value: `${kpis.avg_ctr_pct.toFixed(2)}%`,       icon: MousePointer },
    { label: "Conversions",   value: formatCompact(kpis.total_conversions),   icon: Target       },
    { label: "Avg ROAS",      value: `${kpis.avg_roas.toFixed(2)}x`,          icon: TrendingUp   },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="surface-card rounded-xl p-5 hover:border-primary/40 transition-colors"
        >
          {/* Top row: label on the left, icon on the right */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {label}
            </div>
            <Icon className="w-4 h-4 text-muted-foreground/50" />
          </div>

          {/* The big number */}
          <div className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
