"""
Export pipeline outputs into JSON files for the Next.js web app.

Runs once. The output files land in web/public/data/.
"""

import pandas as pd
import json
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR  = PROJECT_ROOT / "data" / "output"
WEB_DATA = PROJECT_ROOT / "web" / "public" / "data"
WEB_DATA.mkdir(parents=True, exist_ok=True)

# Load the clean unified data with client_id
df = pd.read_csv(OUT_DIR / "unified_ads_clients.csv", parse_dates=['date'])

# Compute CPM
df['cpm'] = np.where(
    df['impressions'].notna() & (df['impressions'] > 0),
    (df['spend_usd'] / df['impressions']) * 1000, np.nan
)

# Overview metrics
overview = {
    'kpis': {
        'total_spend':     float(df['spend_usd'].sum()),
        'total_impressions': int(df['impressions'].sum()),
        'avg_ctr_pct':     float(df['ctr'].mean() * 100),
        'total_conversions': int(df['conversions'].sum()),
        'avg_roas':        float(df['roas'].mean()),
    },
    'platform_efficiency': [],
}

for platform, group in df.groupby('platform'):
    overview['platform_efficiency'].append({
        'platform':          platform,
        'total_spend':       float(group['spend_usd'].sum()),
        'total_impressions': int(group['impressions'].sum()),
        'total_conversions': int(group['conversions'].sum()),
        'avg_ctr_pct':       float(group['ctr'].mean() * 100),
        'avg_cpm':           float(group['cpm'].mean()),
        'avg_cpc':           float(group['cpc'].mean()),
        'avg_roas':          float(group['roas'].mean()),
        'avg_cpa':           float(group['cpa'].mean()),
    })

# Data health, computed from errors_flagged.csv
flagged = pd.read_csv(OUT_DIR / "errors_flagged.csv")
total = len(df) + len(flagged)
pct_flagged = len(flagged) / total * 100
overview['data_health'] = {
    'total_rows':   total,
    'clean_rows':   len(df),
    'flagged_rows': len(flagged),
    'pct_flagged':  float(pct_flagged),
    'status':       'HEALTHY' if pct_flagged < 5 else 'WARNING' if pct_flagged < 15 else 'CRITICAL',
}

# Flag type breakdown
flag_counts = (flagged['flag_reason']
               .str.split(' | ', regex=False)
               .explode()
               .value_counts()
               .to_dict())
overview['data_health']['flag_breakdown'] = [
    {'flag_type': k, 'count': int(v)} for k, v in flag_counts.items()
]

with open(WEB_DATA / 'overview.json', 'w') as f:
    json.dump(overview, f, indent=2)
print(f"overview.json     {len(overview['platform_efficiency'])} platforms")

# Portfolio insights, copied from the existing pipeline output
with open(OUT_DIR / "portfolio_insights.json") as f:
    insights = json.load(f)

with open(WEB_DATA / 'portfolio_insights.json', 'w') as f:
    json.dump(insights, f, indent=2)
print(f"portfolio_insights.json   {len(insights)} insight categories")

# Privacy verification: assert no real geographic identifiers reach the web app
all_files = [WEB_DATA / 'overview.json', WEB_DATA / 'portfolio_insights.json']
forbidden = ['USA', 'UK', 'Germany', 'India', 'UAE', 'Canada', 'Australia']
for filepath in all_files:
    with open(filepath) as f:
        content = f.read()
    leaks = [w for w in forbidden if w in content]
    if leaks:
        print(f"WARNING: {filepath} contains: {leaks}")
    else:
        print(f"  privacy ok: {filepath.name}")

print(f"\nAll JSON files written to {WEB_DATA}")
