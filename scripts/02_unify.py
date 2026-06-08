"""
Ingestion and unification.

Reads all 3 platform CSVs, maps their different column names back to one
unified schema, standardizes dates to ISO format, normalizes campaign name
casing, generates a campaign_id, and concatenates everything into a single
master dataframe.
"""

import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUT_DIR = PROJECT_ROOT / "data" / "output"

# Column mappings: each dict maps a platform's column names to our unified
# internal names. This is the reverse of what the split step did. Adding a new
# platform later just means adding one more dict here.

META_MAP = {
    'Campaign Name'      : 'campaign_name',
    'Impressions'        : 'impressions',
    'Amount Spent (USD)' : 'spend_usd',
    'Reporting Starts'   : 'date',
    'Link Clicks'        : 'clicks',
    'Results'            : 'conversions',
    'Revenue (USD)'      : 'revenue',
    'ROAS'               : 'roas',
    'Industry'           : 'industry',
    'Country'            : 'country',
    'CTR'                : 'ctr',
    'CPC'                : 'cpc',
    'CPA'                : 'cpa',
}

GOOGLE_MAP = {
    'Campaign'    : 'campaign_name',
    'Impr.'       : 'impressions',
    'Cost'        : 'spend_usd',
    'Day'         : 'date',
    'Clicks'      : 'clicks',
    'Conversions' : 'conversions',
    'Revenue'     : 'revenue',
    'ROAS'        : 'roas',
    'Industry'    : 'industry',
    'Country'     : 'country',
    'CTR'         : 'ctr',
    'CPC'         : 'cpc',
    'CPA'         : 'cpa',
}

TIKTOK_MAP = {
    'Campaign name' : 'campaign_name',
    'Total Views'   : 'impressions',
    'Spend'         : 'spend_usd',
    'By Day'        : 'date',
    'Total Clicks'  : 'clicks',
    'Total Conv.'   : 'conversions',
    'Total Revenue' : 'revenue',
    'ROAS'          : 'roas',
    'Industry'      : 'industry',
    'Country'       : 'country',
    'CTR'           : 'ctr',
    'CPC'           : 'cpc',
    'CPA'           : 'cpa',
}


def ingest_platform(filepath, col_map, platform_name, date_format):
    """
    Read one platform CSV and return a cleaned, normalized dataframe.

    filepath      : path to the raw platform CSV
    col_map       : dict of platform column names to unified names
    platform_name : label to tag each row with, e.g. "Meta Ads"
    date_format   : the date format used in this file, e.g. '%m/%d/%Y'
    """
    df = pd.read_csv(filepath)

    # Rename platform-specific columns to our unified names
    df = df.rename(columns=col_map)

    # Keep only the unified columns and drop anything not in our schema
    df = df[list(col_map.values())]

    # Tag every row so we know which platform it came from after merging
    df['platform'] = platform_name

    # Fix the casing mess from the split step. Both "search - fintech" and
    # "SEARCH - FINTECH" become "Search - Fintech".
    df['campaign_name'] = df['campaign_name'].str.title()

    # Parse dates with this platform's specific format and convert to ISO.
    # errors='coerce' turns unparseable dates into NaT instead of crashing.
    df['date'] = pd.to_datetime(df['date'], format=date_format, errors='coerce')

    return df


# Ingest each platform
print("Reading platform files...")

meta = ingest_platform(
    filepath      = RAW_DIR / 'meta_ads.csv',
    col_map       = META_MAP,
    platform_name = 'Meta Ads',
    date_format   = '%m/%d/%Y',   # US format, e.g. 01/21/2024
)

google = ingest_platform(
    filepath      = RAW_DIR / 'google_ads.csv',
    col_map       = GOOGLE_MAP,
    platform_name = 'Google Ads',
    date_format   = '%Y-%m-%d',   # ISO format, e.g. 2024-01-21
)

tiktok = ingest_platform(
    filepath      = RAW_DIR / 'tiktok_ads.csv',
    col_map       = TIKTOK_MAP,
    platform_name = 'TikTok Ads',
    date_format   = '%d/%m/%Y',   # EU format, e.g. 21/01/2024
)

print(f"  Meta Ads   : {len(meta)} rows")
print(f"  Google Ads : {len(google)} rows")
print(f"  TikTok Ads : {len(tiktok)} rows")

# Combine all 3 into one master dataframe
master = pd.concat([meta, google, tiktok], ignore_index=True)

# Generate a compact campaign_id from the campaign name.
# "Search - Fintech" becomes "Search_Fintech". Used as a stable key for
# grouping and deduplication in the error-flagging step.
master['campaign_id'] = (
    master['campaign_name']
    .str.replace(' - ', '_', regex=False)
    .str.replace(' ', '_', regex=False)
)

# Reorder columns into the final unified schema
SCHEMA = [
    'campaign_id', 'campaign_name', 'platform', 'industry', 'country',
    'date', 'impressions', 'clicks', 'spend_usd', 'conversions',
    'revenue', 'roas', 'ctr', 'cpc', 'cpa',
]
master = master[SCHEMA]

# Save
OUT_DIR.mkdir(parents=True, exist_ok=True)
out_path = OUT_DIR / 'unified_master.csv'
master.to_csv(out_path, index=False)

# Summary
print()
print("Unified master dataframe")
print(f"  Total rows     : {len(master)}")
print(f"  Columns        : {len(master.columns)}")
print(f"  Null cells     : {master.isnull().sum().sum()}")
print(f"  Date range     : {master['date'].min().date()} to {master['date'].max().date()}")
print(f"  Platforms      : {master['platform'].unique().tolist()}")
print(f"  Campaign IDs   : {sorted(master['campaign_id'].dropna().unique())}")
print(f"  Saved to       : {out_path}")
print()
print("Sample rows:")
print(master.head(4).to_string())
