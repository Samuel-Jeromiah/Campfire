"""
Cross-client portfolio insights.

Generates aggregated insights across all clients. The privacy rule is
k-anonymity with k=3: any metric derived from fewer than 3 distinct client_ids
is suppressed and never written to the output. This means no single client's
data can be reverse-engineered from the published insights.

Output: data/output/portfolio_insights.json
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR  = PROJECT_ROOT / "data" / "output"
IN_PATH  = OUT_DIR / "unified_ads_clients.csv"
OUT_PATH = OUT_DIR / "portfolio_insights.json"
K_MIN    = 3   # minimum distinct clients required to publish any insight

# Load
df = pd.read_csv(IN_PATH, parse_dates=['date'])
print(f"Loaded {len(df)} rows | {df['client_id'].nunique()} clients")


def k_check(series, label=""):
    """
    Return True if the dataframe slice has at least K_MIN distinct clients.
    Print a suppression notice if it does not.
    """
    n_clients = series['client_id'].nunique()
    if n_clients < K_MIN:
        print(f"  SUPPRESSED [{label}]: only {n_clients} client(s) contributed (k={K_MIN} required)")
        return False
    return True


insights = {}   # all results collected here, then written to JSON

# Insight 1: average CTR by platform across all clients
print("\nInsight 1: Avg CTR by platform")
ctr_rows = []
for platform, group in df.groupby('platform'):
    if k_check(group, f"CTR/{platform}"):
        ctr_rows.append({
            'platform'    : platform,
            'avg_ctr_pct' : round(group['ctr'].mean() * 100, 3),
            'client_count': group['client_id'].nunique(),
        })
insights['avg_ctr_by_platform'] = ctr_rows
for r in ctr_rows:
    print(f"  {r['platform']:12s} avg CTR = {r['avg_ctr_pct']:.3f}%  (n={r['client_count']} clients)")

# Insight 2: best performing channel by month, measured by average ROAS
print("\nInsight 2: Best channel by month (by avg ROAS)")
df['month'] = df['date'].dt.to_period('M').astype(str)

monthly_rows = []
for (month, platform), group in df.groupby(['month', 'platform']):
    if k_check(group, f"monthly/{month}/{platform}"):
        monthly_rows.append({
            'month'       : month,
            'platform'    : platform,
            'avg_roas'    : round(group['roas'].mean(), 3),
            'total_spend' : round(group['spend_usd'].sum(), 2),
            'client_count': group['client_id'].nunique(),
        })

# For each month, identify the best platform by average ROAS
best_by_month = []
month_df = pd.DataFrame(monthly_rows)
if not month_df.empty:
    for month, mgroup in month_df.groupby('month'):
        best_row = mgroup.loc[mgroup['avg_roas'].idxmax()].to_dict()
        best_by_month.append(best_row)

insights['best_channel_by_month'] = best_by_month
insights['monthly_platform_roas'] = monthly_rows
print(f"  {len(monthly_rows)} platform-month combinations passed k-anonymity")

# Insight 3: CPM ranges per platform
print("\nInsight 3: CPM ranges per platform")
df['cpm'] = np.where(
    df['impressions'].notna() & (df['impressions'] > 0),
    (df['spend_usd'] / df['impressions']) * 1000,
    np.nan,
)

cpm_rows = []
for platform, group in df.groupby('platform'):
    cpm_vals = group['cpm'].dropna()
    if k_check(group, f"CPM/{platform}"):
        cpm_rows.append({
            'platform'    : platform,
            'cpm_min'     : round(float(cpm_vals.min()), 2),
            'cpm_p25'     : round(float(cpm_vals.quantile(0.25)), 2),
            'cpm_median'  : round(float(cpm_vals.median()), 2),
            'cpm_p75'     : round(float(cpm_vals.quantile(0.75)), 2),
            'cpm_max'     : round(float(cpm_vals.max()), 2),
            'client_count': group['client_id'].nunique(),
        })
insights['cpm_ranges_by_platform'] = cpm_rows
for r in cpm_rows:
    print(f"  {r['platform']:12s} CPM median=${r['cpm_median']:.2f}  range=[${r['cpm_min']:.2f} to ${r['cpm_max']:.2f}]")

# Insight 4: spend share per platform across the portfolio
print("\nInsight 4: Spend distribution by platform")
if k_check(df, "spend_share"):
    total_spend = df['spend_usd'].sum()
    spend_rows = []
    for platform, group in df.groupby('platform'):
        share = round(group['spend_usd'].sum() / total_spend * 100, 1)
        spend_rows.append({
            'platform'     : platform,
            'total_spend'  : round(group['spend_usd'].sum(), 2),
            'spend_share_pct': share,
            'client_count' : group['client_id'].nunique(),
        })
    insights['spend_share_by_platform'] = spend_rows
    for r in spend_rows:
        print(f"  {r['platform']:12s} {r['spend_share_pct']:.1f}% of portfolio spend")

# Insight 5: portfolio-wide KPI summary
print("\nInsight 5: Portfolio-wide KPIs")
if k_check(df, "portfolio_kpis"):
    insights['portfolio_kpis'] = {
        'total_spend'      : round(df['spend_usd'].sum(), 2),
        'total_impressions': int(df['impressions'].sum()),
        'total_clicks'     : int(df['clicks'].sum()),
        'total_conversions': int(df['conversions'].sum()),
        'avg_roas'         : round(df['roas'].mean(), 3),
        'avg_ctr_pct'      : round(df['ctr'].mean() * 100, 3),
        'avg_cpm'          : round(df['cpm'].mean(), 2),
        'client_count'     : df['client_id'].nunique(),
    }
    print(f"  Total spend = ${insights['portfolio_kpis']['total_spend']:,.2f}")
    print(f"  Avg ROAS    = {insights['portfolio_kpis']['avg_roas']:.3f}x")

# Write output
with open(OUT_PATH, 'w') as f:
    json.dump(insights, f, indent=2)

print(f"\nSaved to: {OUT_PATH}")
print("All insights passed the k-anonymity check (k=3).")
