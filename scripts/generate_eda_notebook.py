"""
Generate eda.ipynb in the project root.

Run once with: python scripts/generate_eda_notebook.py
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def md(text):
    lines = text.strip().split('\n')
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [l + '\n' if i < len(lines) - 1 else l for i, l in enumerate(lines)]
    }


def code(text):
    lines = text.strip().split('\n')
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [l + '\n' if i < len(lines) - 1 else l for i, l in enumerate(lines)]
    }


cells = []

# Title
cells.append(md("""# Ad Performance EDA: Campfire Consulting
**Dataset:** unified_master.csv (1,852 rows across Meta Ads, Google Ads, TikTok Ads)

Each chart answers a specific business question a media strategist would ask.
All charts are interactive, so you can hover, zoom, and click the legend to filter."""))

# Setup
cells.append(md("## Setup: Load Data"))

cells.append(code(r"""import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

DATA_PATH = 'data/output/unified_master.csv'   # run this notebook from the project root

df = pd.read_csv(DATA_PATH, parse_dates=['date'])

print(f"Rows     : {len(df)}")
print(f"Columns  : {df.columns.tolist()}")
print(f"Platforms: {df['platform'].unique().tolist()}")
print(f"Nulls    : {df.isnull().sum().sum()} total")
df.head()"""))

# Chart 1: Treemap
cells.append(md("""## Chart 1: Treemap, where is the budget going?
**Question:** Which platform and campaign type is consuming the most spend?

A treemap shows proportional hierarchy, so you see both the platform-level split
and the campaign breakdown inside each platform in one view.
A bar chart cannot show this nesting."""))

cells.append(code("""# Group spend by platform and campaign name
treemap_df = (
    df.dropna(subset=['spend_usd'])
    .groupby(['platform', 'campaign_name'], as_index=False)['spend_usd']
    .sum()
    .rename(columns={'spend_usd': 'Total Spend (USD)'})
)

fig = px.treemap(
    treemap_df,
    path=['platform', 'campaign_name'],   # two-level hierarchy
    values='Total Spend (USD)',
    color='Total Spend (USD)',
    color_continuous_scale='Blues',
    title='Ad Spend Distribution by Platform and Campaign Type',
)
fig.update_traces(textinfo='label+percent root')
fig.update_layout(margin=dict(t=50, l=10, r=10, b=10))
fig.show()"""))

# Chart 2: Dual-axis line
cells.append(md("""## Chart 2: Dual-axis line, did higher spend lead to higher returns?
**Question:** When we spent more on a platform, did ROAS go up or down?

Left Y-axis is daily spend, right Y-axis is daily ROAS (return on ad spend).
Divergence between the two lines reveals inefficient spend periods."""))

cells.append(code("""# Aggregate spend and ROAS by date and platform
time_df = (
    df.dropna(subset=['spend_usd', 'roas', 'date'])
    .groupby(['date', 'platform'], as_index=False)
    .agg(spend_usd=('spend_usd', 'sum'), roas=('roas', 'mean'))
)

platform_colors = {
    'Meta Ads'  : '#1877F2',
    'Google Ads': '#34A853',
    'TikTok Ads': '#FF0050',
}

fig = make_subplots(specs=[[{'secondary_y': True}]])

for platform in time_df['platform'].unique():
    pdf = time_df[time_df['platform'] == platform]
    color = platform_colors.get(platform, 'gray')

    # Spend line, solid, left axis
    fig.add_trace(
        go.Scatter(
            x=pdf['date'], y=pdf['spend_usd'],
            name=f'{platform} Spend',
            mode='lines',
            line=dict(color=color, width=2),
        ),
        secondary_y=False,
    )

    # ROAS line, dashed, right axis
    fig.add_trace(
        go.Scatter(
            x=pdf['date'], y=pdf['roas'],
            name=f'{platform} ROAS',
            mode='lines',
            line=dict(color=color, width=1.5, dash='dash'),
        ),
        secondary_y=True,
    )

fig.update_layout(title='Daily Spend vs ROAS by Platform', hovermode='x unified')
fig.update_yaxes(title_text='Daily Spend (USD)', secondary_y=False)
fig.update_yaxes(title_text='Average ROAS', secondary_y=True)
fig.show()"""))

# Chart 3: Scatter quadrant
cells.append(md("""## Chart 3: Scatter, which campaigns should we scale or cut?
**Question:** Which campaigns deliver high conversions relative to what we spend?

Each dot is one campaign row. Quadrant lines sit at the median spend and median conversions.
- Top-right: high spend, high conversions, so **scale these**
- Top-left: low spend, high conversions, so these are **hidden gems, increase budget**
- Bottom-right: high spend, low conversions, so **cut or optimize**
- Bottom-left: low spend, low conversions, so **ignore**

Dot size is ROAS. Hover for full details."""))

cells.append(code("""scatter_df = df.dropna(subset=['spend_usd', 'conversions', 'roas']).copy()

median_spend = scatter_df['spend_usd'].median()
median_conv  = scatter_df['conversions'].median()

fig = px.scatter(
    scatter_df,
    x='spend_usd',
    y='conversions',
    color='platform',
    size='roas',
    size_max=20,
    hover_data=['campaign_name', 'industry', 'country', 'roas', 'cpa'],
    color_discrete_map={
        'Meta Ads'  : '#1877F2',
        'Google Ads': '#34A853',
        'TikTok Ads': '#FF0050',
    },
    title='Spend vs Conversions: Campaign Efficiency Map',
    labels={'spend_usd': 'Spend (USD)', 'conversions': 'Conversions'},
    opacity=0.7,
)

# Quadrant reference lines
fig.add_vline(x=median_spend, line_dash='dot', line_color='gray',
              annotation_text='Median Spend', annotation_position='top right')
fig.add_hline(y=median_conv, line_dash='dot', line_color='gray',
              annotation_text='Median Conv.', annotation_position='top right')

# Quadrant labels
for x_pos, y_pos, label in [
    (scatter_df['spend_usd'].max()*0.85, scatter_df['conversions'].max()*0.95, 'SCALE'),
    (scatter_df['spend_usd'].min()*1.5,  scatter_df['conversions'].max()*0.95, 'HIDDEN GEM'),
    (scatter_df['spend_usd'].max()*0.85, scatter_df['conversions'].min()*1.5,  'CUT'),
    (scatter_df['spend_usd'].min()*1.5,  scatter_df['conversions'].min()*1.5,  'IGNORE'),
]:
    fig.add_annotation(x=x_pos, y=y_pos, text=label,
                       showarrow=False, font=dict(size=11, color='gray'),
                       opacity=0.6)

fig.show()"""))

# Chart 4: Funnel
cells.append(md("""## Chart 4: Funnel, where are we losing people?
**Question:** At which stage (impressions, clicks, or conversions) does each platform drop off the most?

TikTok may get the most views but convert the least.
Google may have fewer impressions but the highest conversion rate.
This funnel makes that visible immediately."""))

cells.append(code("""funnel_df = (
    df.dropna(subset=['impressions', 'clicks', 'conversions'])
    .groupby('platform', as_index=False)
    .agg(
        Impressions  =('impressions', 'sum'),
        Clicks       =('clicks',      'sum'),
        Conversions  =('conversions', 'sum'),
    )
)

platform_colors = {
    'Meta Ads'  : '#1877F2',
    'Google Ads': '#34A853',
    'TikTok Ads': '#FF0050',
}

fig = go.Figure()

for _, row in funnel_df.iterrows():
    fig.add_trace(go.Funnel(
        name=row['platform'],
        y=['Impressions', 'Clicks', 'Conversions'],
        x=[row['Impressions'], row['Clicks'], row['Conversions']],
        textposition='inside',
        textinfo='value+percent initial',
        marker_color=platform_colors.get(row['platform'], 'gray'),
    ))

fig.update_layout(
    title='Conversion Funnel by Platform: Impressions to Clicks to Conversions',
    funnelmode='group',
)
fig.show()"""))

# Chart 5: Box plot CPM
cells.append(md("""## Chart 5: Box plot, how noisy is our cost per thousand impressions?
**Question:** Is CPM (cost per 1,000 impressions) consistent, or are there extreme outliers?

This directly motivates the CPM spike flag in the error-flagging step.
Wide boxes mean high variance and unreliable pricing data.
Outlier dots are the rows that will get flagged in the error detection step."""))

cells.append(code("""cpm_df = df.dropna(subset=['spend_usd', 'impressions']).copy()
cpm_df = cpm_df[cpm_df['impressions'] > 0]   # avoid divide-by-zero

# CPM is cost per 1,000 impressions
cpm_df['CPM'] = (cpm_df['spend_usd'] / cpm_df['impressions']) * 1000

fig = px.box(
    cpm_df,
    x='platform',
    y='CPM',
    color='platform',
    points='outliers',    # show outlier dots only, not all points
    color_discrete_map={
        'Meta Ads'  : '#1877F2',
        'Google Ads': '#34A853',
        'TikTok Ads': '#FF0050',
    },
    title='CPM Distribution by Platform: Cost Per 1,000 Impressions',
    labels={'CPM': 'CPM (USD)', 'platform': 'Platform'},
)
fig.update_layout(showlegend=False)

# Print the outlier threshold that the error-flagging step uses (5x the mean)
for platform in cpm_df['platform'].unique():
    mean_cpm = cpm_df[cpm_df['platform'] == platform]['CPM'].mean()
    print(f"{platform:12s}  mean CPM = ${mean_cpm:.2f}  |  5x threshold = ${mean_cpm*5:.2f}")

fig.show()"""))

# Chart 6: Missing value heatmap
cells.append(md("""## Chart 6: Heatmap, where is our data quality worst?
**Question:** Which columns and which platforms have the most missing values?

This validates that the messiness injection in the split step worked correctly and
shows exactly which cells the error-flagging step will mark as a missing critical field."""))

cells.append(code("""numeric_cols = ['impressions', 'clicks', 'spend_usd', 'conversions',
                'revenue', 'roas', 'ctr', 'cpc', 'cpa']

# Calculate the percent missing per column per platform
records = []
for platform in df['platform'].unique():
    pdf = df[df['platform'] == platform]
    for col in numeric_cols:
        pct = round(pdf[col].isnull().mean() * 100, 2)
        records.append({'Platform': platform, 'Column': col, '% Missing': pct})

heatmap_df = pd.DataFrame(records)
pivot = heatmap_df.pivot(index='Platform', columns='Column', values='% Missing')

fig = px.imshow(
    pivot,
    text_auto=True,
    color_continuous_scale='Reds',
    title='Missing Value % by Column and Platform',
    labels={'color': '% Missing'},
    aspect='auto',
)
fig.update_xaxes(tickangle=45)
fig.show()"""))

# Build the notebook JSON
notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python",
            "version": "3.8.0"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 5
}

out_path = PROJECT_ROOT / 'eda.ipynb'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"eda.ipynb created at {out_path}")
print(f"Cells: {len(cells)}")
