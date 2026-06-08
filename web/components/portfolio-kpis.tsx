import { DollarSign, Eye, Target, TrendingUp, Users } from "lucide-react";

type Props = {
  kpis: {
    total_spend: number;
    total_impressions: number;
    total_conversions: number;
    avg_roas: number;
    client_count: number;
  };
};

/*
  Formats a large number into a compact short form.
  For example: 10000000 becomes "$10.0M", 168000 becomes "168.0K".
*/
function compact(n: number, prefix = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

/*
  PortfolioKPIs shows the five headline numbers for the aggregated
  cross-client portfolio. These are calculated from data pooled across
  all 3 anonymized clients, with k-anonymity verified before display.
*/
export default function PortfolioKPIs({ kpis }: Props) {
  const items = [
    { label: "Clients",         value: kpis.client_count.toString(),        icon: Users      },
    { label: "Portfolio Spend", value: compact(kpis.total_spend, "$"),      icon: DollarSign },
    { label: "Impressions",     value: compact(kpis.total_impressions),     icon: Eye        },
    { label: "Conversions",     value: compact(kpis.total_conversions),     icon: Target     },
    { label: "Avg ROAS",        value: `${kpis.avg_roas.toFixed(2)}x`,      icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="surface-card rounded-xl p-5 hover:border-primary/40 transition-colors"
        >
          {/* Label and icon on the top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              {label}
            </div>
            <Icon className="w-4 h-4 text-muted-foreground/50" />
          </div>

          {/* The big number below the label */}
          <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

