"""
Automated error flagging and output files.

Reads unified_master.csv, runs 5 checks on every row, tags each bad row with
a flag_reason, then writes two output files:
  unified_ads.csv      clean rows only
  errors_flagged.csv   flagged rows plus a flag_reason column
"""

import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT = PROJECT_ROOT / "data" / "output"
DATA = OUT / "unified_master.csv"

# Load
df = pd.read_csv(DATA, parse_dates=['date'])
print(f"Loaded {len(df)} rows from unified_master.csv\n")

# Each row starts with an empty list. Flags get appended as the checks run,
# which lets a single row accumulate more than one flag cleanly.
df['_flags'] = [[] for _ in range(len(df))]

# Pre-compute CPM, used by the CPM spike check below.
# CPM is cost per 1,000 impressions, undefined when impressions is null or zero.
df['_cpm'] = np.where(
    df['impressions'].notna() & (df['impressions'] > 0),
    (df['spend_usd'] / df['impressions']) * 1000,
    np.nan
)

# Build a 7-day rolling average CPM per platform as the baseline for each row.
# Step 1: daily average CPM per platform, collapsing all campaigns for that day.
daily_cpm = (
    df.dropna(subset=['_cpm'])
      .groupby(['platform', 'date'])['_cpm']
      .mean()
      .reset_index()
      .rename(columns={'_cpm': '_daily_avg_cpm'})
      .sort_values(['platform', 'date'])
)

# Step 2: rolling 7-day mean within each platform.
# min_periods=1 means the first few days still get a mean instead of NaN.
daily_cpm['_rolling_avg_cpm'] = (
    daily_cpm
    .groupby('platform')['_daily_avg_cpm']
    .transform(lambda x: x.rolling(window=7, min_periods=1).mean())
)

# Step 3: join the rolling average back onto the main dataframe.
df = df.merge(
    daily_cpm[['platform', 'date', '_rolling_avg_cpm']],
    on=['platform', 'date'],
    how='left'
)

# Check 1: clicks greater than impressions.
# This is mathematically impossible and signals a reporting bug or corruption.
mask_f1 = df['clicks'] > df['impressions']
df.loc[mask_f1, '_flags'] = df.loc[mask_f1, '_flags'].apply(
    lambda x: x + ['clicks_exceed_impressions']
)
print(f"FLAG 1  clicks > impressions     : {mask_f1.sum():>5} rows")

# Check 2: negative values.
# No ad platform charges negative money, so this points to a bad export.
mask_neg_spend = df['spend_usd'].notna() & (df['spend_usd'] < 0)
mask_neg_impr  = df['impressions'].notna() & (df['impressions'] < 0)

df.loc[mask_neg_spend, '_flags'] = df.loc[mask_neg_spend, '_flags'].apply(
    lambda x: x + ['negative_spend']
)
df.loc[mask_neg_impr, '_flags'] = df.loc[mask_neg_impr, '_flags'].apply(
    lambda x: x + ['negative_impressions']
)
print(f"FLAG 2  negative spend           : {mask_neg_spend.sum():>5} rows")
print(f"FLAG 2  negative impressions     : {mask_neg_impr.sum():>5} rows")

# Check 3: missing critical fields.
# A row missing date, impressions, clicks, or spend cannot be used in any
# report or billing calculation, so it gets surfaced instead of dropped quietly.
critical_cols = ['date', 'impressions', 'clicks', 'spend_usd']
for col in critical_cols:
    mask = df[col].isnull()
    df.loc[mask, '_flags'] = df.loc[mask, '_flags'].apply(
        lambda x, c=col: x + [f'missing_{c}']
    )
    print(f"FLAG 3  missing {col:<16s}: {mask.sum():>5} rows")

# Check 4: CPM spike outlier.
# If a row's CPM is more than 5x the platform's 7-day rolling average, it is
# almost certainly a data error rather than a real price jump.
mask_f4 = (
    df['_cpm'].notna() &
    df['_rolling_avg_cpm'].notna() &
    (df['_cpm'] > 5 * df['_rolling_avg_cpm'])
)
df.loc[mask_f4, '_flags'] = df.loc[mask_f4, '_flags'].apply(
    lambda x: x + ['cpm_spike_outlier']
)
print(f"FLAG 4  CPM spike outlier        : {mask_f4.sum():>5} rows")

# Check 5: duplicate rows.
# Same platform, campaign_id, and date appearing more than once inflates spend.
# keep='first' keeps the first occurrence clean and flags the rest.
mask_f5 = df.duplicated(subset=['platform', 'campaign_id', 'date'], keep='first')
df.loc[mask_f5, '_flags'] = df.loc[mask_f5, '_flags'].apply(
    lambda x: x + ['duplicate_row']
)
print(f"FLAG 5  duplicate rows           : {mask_f5.sum():>5} rows")

# Build the flag_reason column by joining a row's flags into one readable
# string, for example "missing_clicks | duplicate_row".
df['flag_reason'] = df['_flags'].apply(lambda x: ' | '.join(x) if x else '')

# Drop the internal helper columns, which do not belong in the output
df = df.drop(columns=['_flags', '_cpm', '_rolling_avg_cpm'])

# Split clean rows from flagged rows
clean_df   = df[df['flag_reason'] == ''].drop(columns=['flag_reason'])
flagged_df = df[df['flag_reason'] != ''].copy()

# Save both files
clean_path   = OUT / 'unified_ads.csv'
flagged_path = OUT / 'errors_flagged.csv'

clean_df.to_csv(clean_path,   index=False)
flagged_df.to_csv(flagged_path, index=False)

# Summary
total       = len(df)
n_flagged   = len(flagged_df)
n_clean     = len(clean_df)
pct_flagged = n_flagged / total * 100

print(f"\n{'='*50}")
print(f"Total rows     : {total}")
print(f"Clean rows     : {n_clean}  ({100 - pct_flagged:.1f}%)")
print(f"Flagged rows   : {n_flagged}  ({pct_flagged:.1f}%)")
print(f"\nFlag breakdown:")
flag_counts = (
    flagged_df['flag_reason']
    .str.split(' | ', regex=False)   # regex=False treats | as a literal, not OR
    .explode()
    .value_counts()
)
for flag, count in flag_counts.items():
    print(f"  {flag:<35} : {count}")

print(f"\nFiles saved:")
print(f"  {clean_path}")
print(f"  {flagged_path}")
