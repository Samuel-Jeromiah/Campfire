"""
Multi-client anonymization.

Reads unified_ads.csv (clean rows, with flagged rows already removed) and
assigns each row to an anonymized client_id based on a country grouping.

No real client names are ever stored, only Client_A, Client_B, and Client_C.
The country to client mapping lives only in this file.
Output: unified_ads_clients.csv (the same 15 columns with client_id prepended).
"""

import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR  = PROJECT_ROOT / "data" / "output"
IN_PATH  = OUT_DIR / "unified_ads.csv"
OUT_PATH = OUT_DIR / "unified_ads_clients.csv"

# Country to client mapping, grouped by region so each client represents a
# realistic geographic market. This is the only place the real country to
# client mapping exists. Everything downstream sees client_id, never this dict.
COUNTRY_TO_CLIENT = {
    # English-speaking and Western hemisphere
    'USA'       : 'Client_A',
    'Canada'    : 'Client_A',
    'Australia' : 'Client_A',

    # Europe
    'UK'        : 'Client_B',
    'Germany'   : 'Client_B',

    # MENA and South Asia
    'UAE'       : 'Client_C',
    'India'     : 'Client_C',
}

# Load
df = pd.read_csv(IN_PATH, parse_dates=['date'])
print(f"Loaded {len(df)} rows from unified_ads.csv")

# Assign client_id. map() returns NaN for any country not in the dict, which
# is caught by the safety check below.
df['client_id'] = df['country'].map(COUNTRY_TO_CLIENT)

# Safety check: flag any country that did not get assigned
unmapped = df[df['client_id'].isna()]['country'].unique()
if len(unmapped) > 0:
    print(f"WARNING: unmapped countries {unmapped}. Assigning to Client_C.")
    df['client_id'] = df['client_id'].fillna('Client_C')

# Reorder columns so client_id comes first
cols = ['client_id'] + [c for c in df.columns if c != 'client_id']
df = df[cols]

# Save
df.to_csv(OUT_PATH, index=False)

# Verification
print(f"\nClient distribution:")
print(df.groupby('client_id')['country'].apply(lambda x: sorted(x.unique())).to_string())
print(f"\nRow counts:")
print(df['client_id'].value_counts().to_string())
print(f"\nTotal rows : {len(df)}")
print(f"Columns    : {df.columns.tolist()}")
print(f"Saved to   : {OUT_PATH}")

# Anonymization check: confirm no real client identifiers leaked into the output
real_names_check = ['Fintech Corp', 'Global Media', 'MegaBrand', 'real_client']
for col in df.columns:
    for name in real_names_check:
        if df[col].astype(str).str.contains(name, case=False).any():
            print(f"PRIVACY ALERT: Real client name '{name}' found in column '{col}'")

# Confirm only Client_A, Client_B, and Client_C appear in the client_id column
allowed_ids = {'Client_A', 'Client_B', 'Client_C'}
actual_ids  = set(df['client_id'].unique())
assert actual_ids.issubset(allowed_ids), f"Unexpected client IDs found: {actual_ids - allowed_ids}"
print("\nAnonymization check passed: only Client_A, Client_B, and Client_C present in output.")
