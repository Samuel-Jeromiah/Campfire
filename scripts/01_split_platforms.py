"""
Simulate raw platform exports.

Takes the single unified source dataset and splits it into 3 separate CSVs
that look like raw exports from Meta Ads Manager, Google Ads, and TikTok Ads
Manager. Each file gets different column names, a different date format, and
some real-world messiness (duplicates, missing values, inconsistent casing).
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Fixed seed so the random messiness is reproducible on every run
np.random.seed(42)

# Paths are resolved relative to this file, so the project runs from any folder
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE  = PROJECT_ROOT / "data" / "source" / "global_ads_performance_dataset.csv"
RAW_DIR = PROJECT_ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# Load the source data
df = pd.read_csv(SOURCE)

# Convert the date string to a datetime so we can reformat it per platform later
df['date'] = pd.to_datetime(df['date'])

# Build a readable campaign name like "Search - Fintech" or "Video - Healthcare".
# This mimics the names a media buyer would type into an ad platform.
df['campaign_name'] = df['campaign_type'] + ' - ' + df['industry']

# Column mappings: each dict maps our internal column name to whatever that
# platform actually calls it. Same data, very different labels.

META_COLS = {
    'campaign_name' : 'Campaign Name',
    'impressions'   : 'Impressions',
    'ad_spend'      : 'Amount Spent (USD)',
    'date'          : 'Reporting Starts',
    'clicks'        : 'Link Clicks',
    'conversions'   : 'Results',
    'revenue'       : 'Revenue (USD)',
    'ROAS'          : 'ROAS',
    'industry'      : 'Industry',
    'country'       : 'Country',
    'CTR'           : 'CTR',
    'CPC'           : 'CPC',
    'CPA'           : 'CPA',
}

GOOGLE_COLS = {
    'campaign_name' : 'Campaign',
    'impressions'   : 'Impr.',
    'ad_spend'      : 'Cost',
    'date'          : 'Day',
    'clicks'        : 'Clicks',
    'conversions'   : 'Conversions',
    'revenue'       : 'Revenue',
    'ROAS'          : 'ROAS',
    'industry'      : 'Industry',
    'country'       : 'Country',
    'CTR'           : 'CTR',
    'CPC'           : 'CPC',
    'CPA'           : 'CPA',
}

TIKTOK_COLS = {
    'campaign_name' : 'Campaign name',
    'impressions'   : 'Total Views',
    'ad_spend'      : 'Spend',
    'date'          : 'By Day',
    'clicks'        : 'Total Clicks',
    'conversions'   : 'Total Conv.',
    'revenue'       : 'Total Revenue',
    'ROAS'          : 'ROAS',
    'industry'      : 'Industry',
    'country'       : 'Country',
    'CTR'           : 'CTR',
    'CPC'           : 'CPC',
    'CPA'           : 'CPA',
}


def inject_messiness(df, spend_col, impressions_col, clicks_col, campaign_col):
    """
    Introduce three kinds of real-world data quality problems:
      1. Duplicate rows: the platform accidentally exports a row twice.
      2. Missing values: the export drops some cells (common with API limits).
      3. Casing issues: campaign names typed inconsistently by different users.
    """
    df = df.copy()

    # 1. Duplicates: randomly pick 3% of rows and append them again
    n_dupes = max(1, int(len(df) * 0.03))
    dupes = df.sample(n=n_dupes, random_state=42)
    df = pd.concat([df, dupes], ignore_index=True)

    # 2. Nulls: blank out 5% of cells in the three most critical numeric columns
    for col in [spend_col, impressions_col, clicks_col]:
        null_idx = df.sample(frac=0.05, random_state=42).index
        df.loc[null_idx, col] = np.nan

    # 3. Casing: randomly lowercase 10% of campaign names.
    # For example "Search - Fintech" becomes "search - fintech".
    lower_idx = df.sample(frac=0.10, random_state=42).index
    df.loc[lower_idx, campaign_col] = df.loc[lower_idx, campaign_col].str.lower()

    return df


# Meta Ads
meta = df[df['platform'] == 'Meta Ads'].copy()

# Select the columns we want, then rename them to Meta's labels
meta = meta[list(META_COLS.keys())].rename(columns=META_COLS)

# Inject mess before formatting dates so duplicates share the same date format
meta = inject_messiness(meta, 'Amount Spent (USD)', 'Impressions', 'Link Clicks', 'Campaign Name')

# Meta Ads Manager exports dates as MM/DD/YYYY (US format)
meta['Reporting Starts'] = pd.to_datetime(meta['Reporting Starts']).dt.strftime('%m/%d/%Y')

meta.to_csv(RAW_DIR / 'meta_ads.csv', index=False)
print(f"meta_ads.csv   : {len(meta)} rows (630 original + {len(meta) - 630} duplicates injected)")

# Google Ads
google = df[df['platform'] == 'Google Ads'].copy()

google = google[list(GOOGLE_COLS.keys())].rename(columns=GOOGLE_COLS)
google = inject_messiness(google, 'Cost', 'Impr.', 'Clicks', 'Campaign')

# Google Ads exports dates as YYYY-MM-DD, which matches our source format
google['Day'] = pd.to_datetime(google['Day']).dt.strftime('%Y-%m-%d')

google.to_csv(RAW_DIR / 'google_ads.csv', index=False)
print(f"google_ads.csv : {len(google)} rows (720 original + {len(google) - 720} duplicates injected)")

# TikTok Ads
tiktok = df[df['platform'] == 'TikTok Ads'].copy()

tiktok = tiktok[list(TIKTOK_COLS.keys())].rename(columns=TIKTOK_COLS)
tiktok = inject_messiness(tiktok, 'Spend', 'Total Views', 'Total Clicks', 'Campaign name')

# TikTok Ads Manager exports dates as DD/MM/YYYY (European format)
tiktok['By Day'] = pd.to_datetime(tiktok['By Day']).dt.strftime('%d/%m/%Y')

tiktok.to_csv(RAW_DIR / 'tiktok_ads.csv', index=False)
print(f"tiktok_ads.csv : {len(tiktok)} rows (450 original + {len(tiktok) - 450} duplicates injected)")

print("\nDone. Platform CSVs saved to data/raw/")
