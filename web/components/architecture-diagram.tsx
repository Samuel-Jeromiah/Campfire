"use client";

import { Shuffle, AlertTriangle, Users, BarChart3, Globe, ArrowDown } from "lucide-react";

const PLATFORMS = [
  {
    name: "Meta Ads",
    rows: "648 rows",
    date: "MM/DD/YYYY",
    column: "Amount Spent (USD)",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "text-blue-800",
    meta: "text-blue-600",
  },
  {
    name: "Google Ads",
    rows: "741 rows",
    date: "YYYY-MM-DD",
    column: "Cost, Impr.",
    dot: "bg-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    title: "text-green-800",
    meta: "text-green-600",
  },
  {
    name: "TikTok Ads",
    rows: "464 rows",
    date: "DD/MM/YYYY",
    column: "Spend, Total Views",
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "text-rose-800",
    meta: "text-rose-600",
  },
];

const STAGES = [
  {
    num: "01",
    Icon: Shuffle,
    title: "Schema Unification",
    script: "02_unify.py",
    description:
      "Column mapping dictionaries translate each platform's proprietary names into one shared schema. All dates are normalised to ISO 8601. A stable campaign_id is generated from a hash of the campaign name.",
    inputLabel: "3 platform CSVs",
    inputDetail: "1,853 total rows (includes injected duplicates)",
    outputLabel: "unified_master.csv",
    outputDetail: "1,852 rows in a single unified schema",
    callout: "Meta calls it \"Amount Spent\" Â· Google calls it \"Cost\" Â· TikTok calls it \"Spend\"",
    numBg: "bg-violet-600",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    leftBar: "border-l-violet-400",
    pillBg: "bg-violet-50 border-violet-200 text-violet-700",
    calloutBg: "bg-violet-50 border-violet-200 text-violet-700",
  },
  {
    num: "02",
    Icon: AlertTriangle,
    title: "Automated Quality Audit",
    script: "04_flag_errors.py",
    description:
      "Five independent rules run on every row. Flagged rows are quarantined into a separate file and are never used in any downstream calculation.",
    inputLabel: "unified_master.csv",
    inputDetail: "1,852 rows to be validated",
    outputLabel: "unified_ads.csv + errors_flagged.csv",
    outputDetail: "1,634 clean (88.2%) + 218 flagged (11.8%)",
    callout: "Rules: clicks > impressions, negative values, missing fields, CPM spike 5x rolling avg, exact duplicates",
    numBg: "bg-amber-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    leftBar: "border-l-amber-400",
    pillBg: "bg-amber-50 border-amber-200 text-amber-700",
    calloutBg: "bg-amber-50 border-amber-200 text-amber-700",
    showQualityBar: true,
  },
  {
    num: "03",
    Icon: Users,
    title: "Multi-Client Anonymisation",
    script: "05_add_clients.py",
    description:
      "Each row is assigned to an anonymous Client ID based on country groupings. The country column is then dropped entirely. No PII is ever stored in any output file.",
    inputLabel: "unified_ads.csv",
    inputDetail: "1,634 rows with country column",
    outputLabel: "unified_ads_clients.csv",
    outputDetail: "1,634 rows with client_id, no country",
    callout: "Client A: USA, Canada, AU   |   Client B: UK, Germany   |   Client C: UAE, India",
    numBg: "bg-sky-600",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    leftBar: "border-l-sky-400",
    pillBg: "bg-sky-50 border-sky-200 text-sky-700",
    calloutBg: "bg-sky-50 border-sky-200 text-sky-700",
  },
  {
    num: "04",
    Icon: BarChart3,
    title: "K-Anonymous Aggregation",
    script: "06_portfolio_insights.py",
    description:
      "Computes cross-client portfolio metrics: CTR by platform, ROAS trends, CPM ranges, and spend share. K-anonymity is enforced at k=3: any metric derived from fewer than 3 distinct clients is automatically suppressed before export.",
    inputLabel: "unified_ads_clients.csv",
    inputDetail: "1,634 rows across 3 anonymous clients",
    outputLabel: "portfolio_insights.json",
    outputDetail: "Every metric verified: client_count >= 3",
    callout: "Privacy guarantee: no single client's data can be reverse-engineered from any published metric",
    numBg: "bg-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    leftBar: "border-l-emerald-400",
    pillBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    calloutBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
];

const OUTPUTS = [
  {
    Icon: Globe,
    label: "Next.js Web App",
    audience: "TypeScript + React 19 + Tailwind CSS + Recharts",
    script: "web/",
    pages: [
      "Overview: portfolio KPIs, platform efficiency table, data quality report",
      "Portfolio Insights: ROAS trends, CTR benchmarks, CPM ranges, spend share, privacy audit log",
      "Channel Recommendation: goal + budget + audience input scored against real portfolio data",
      "Pipeline Architecture: this diagram, fully embedded in the app",
    ],
    headerBg: "bg-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    subtext: "text-indigo-600",
    dotColor: "bg-indigo-500",
  },
];

export default function ArchitectureDiagram() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">

      {/* â”€â”€ LAYER 1: Ingestion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LayerHeader
        label="Layer 1"
        title="Raw Ingestion"
        subtitle="Three platforms, three incompatible schemas"
        bg="bg-violet-700"
      />

      <div className="bg-white p-5 border-b border-border">
        <div className="grid grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className={`rounded-xl border ${p.border} ${p.bg} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`} />
                <span className={`font-bold text-sm ${p.title}`}>{p.name}</span>
              </div>
              <div className="space-y-1.5">
                <Row label="Rows" value={p.rows} color={p.meta} />
                <Row label="Date format" value={p.date} color={p.meta} />
                <Row label="Spend column" value={p.column} color={p.meta} mono />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Flow connector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <FlowArrow label="1,853 total rows merged" />

      {/* â”€â”€ LAYER 2: Processing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LayerHeader
        label="Layer 2"
        title="Processing Pipeline"
        subtitle="Four automated stages, each writing its own output file"
        bg="bg-gray-900"
      />

      <div className="bg-white divide-y divide-border">
        {STAGES.map((s) => (
          <StageRow key={s.num} stage={s} />
        ))}
      </div>

      {/* â”€â”€ Flow connector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <FlowArrow label="same clean data, two different audiences" />

      {/* â”€â”€ LAYER 3: Outputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LayerHeader
        label="Layer 3"
        title="Output Layer"
        subtitle="Next.js web application with 3 pages"
        bg="bg-gray-900"
      />

      <div className="bg-white p-5 grid grid-cols-1 gap-4">
        {OUTPUTS.map((o) => (
          <OutputCard key={o.label} output={o} />
        ))}
      </div>

    </div>
  );
}

/* â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function LayerHeader({
  label,
  title,
  subtitle,
  bg,
}: {
  label: string;
  title: string;
  subtitle: string;
  bg: string;
}) {
  return (
    <div className={`${bg} px-6 py-4 flex items-center gap-4`}>
      <span className="text-xs font-mono font-bold text-white/60 uppercase tracking-widest shrink-0">
        {label}
      </span>
      <div className="w-px h-6 bg-white/20 shrink-0" />
      <div>
        <div className="text-base font-bold text-white">{title}</div>
        <div className="text-xs text-white/60 mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="bg-gray-50 border-y border-border flex flex-col items-center py-3 gap-1">
      <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function StageRow({ stage }: { stage: (typeof STAGES)[number] }) {
  const { Icon } = stage;
  return (
    <div className={`border-l-4 ${stage.leftBar} px-6 py-5`}>
      <div className="flex flex-col md:flex-row md:items-start gap-5">

        {/* Left: number + icon + title */}
        <div className="flex items-start gap-3 shrink-0 md:w-64">
          <div className={`w-9 h-9 rounded-xl ${stage.numBg} flex items-center justify-center shrink-0`}>
            <span className="text-sm font-bold text-white">{stage.num}</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">{stage.title}</div>
            <code className={`text-xs font-mono px-1.5 py-0.5 rounded border ${stage.pillBg} mt-1 inline-block`}>
              {stage.script}
            </code>
          </div>
        </div>

        {/* Right: description + callout + metrics */}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{stage.description}</p>

          {/* Quality bar for stage 02 */}
          {stage.showQualityBar && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-emerald-600 font-medium">88.2% passed</span>
                <span className="text-amber-600 font-medium">11.8% flagged</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "88.2%" }} />
              </div>
            </div>
          )}

          {/* Callout detail */}
          <div className={`text-xs rounded-lg border px-3 py-2 leading-relaxed ${stage.calloutBg}`}>
            {stage.callout}
          </div>

          {/* IN / OUT metric pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <MetricPill dir="IN" label={stage.inputLabel} detail={stage.inputDetail} />
            <div className="flex items-center text-muted-foreground/50">
              <span className="text-base">&#8594;</span>
            </div>
            <MetricPill dir="OUT" label={stage.outputLabel} detail={stage.outputDetail} />
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricPill({ dir, label, detail }: { dir: "IN" | "OUT"; label: string; detail: string }) {
  const isOut = dir === "OUT";
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${isOut ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}>
      <span className={`font-bold text-[10px] uppercase tracking-wider mr-1.5 ${isOut ? "text-emerald-600" : "text-gray-400"}`}>
        {dir}
      </span>
      <span className="font-semibold text-foreground">{label}</span>
      <span className="text-muted-foreground ml-1">{detail}</span>
    </div>
  );
}

function OutputCard({ output }: { output: (typeof OUTPUTS)[number] }) {
  const { Icon } = output;
  return (
    <div className={`rounded-xl border ${output.border} ${output.bg} overflow-hidden`}>
      <div className={`${output.headerBg} px-4 py-3 flex items-center gap-2.5`}>
        <Icon className="w-4 h-4 text-white shrink-0" />
        <span className="font-bold text-sm text-white">{output.label}</span>
        <code className="ml-auto text-[10px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
          {output.script}
        </code>
      </div>
      <div className="px-4 py-4">
        <div className={`text-xs font-medium mb-3 ${output.subtext}`}>{output.audience}</div>
        <ul className="space-y-2">
          {output.pages.map((page) => (
            <li key={page} className="flex items-start gap-2">
              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${output.dotColor}`} />
              <span className="text-sm text-foreground/80 leading-snug">{page}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs font-medium truncate ${color} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

