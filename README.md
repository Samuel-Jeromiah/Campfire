# Campfire

A prototype data platform for ad agencies. It ingests messy ad exports from
Meta, Google, and TikTok, unifies them into one schema, automatically flags bad
data, anonymizes each client, and produces privacy-safe cross-client benchmarks
using k-anonymity. A Next.js web app on top presents the insights and recommends
the best ad channel for a new client.

## The problem

Agencies that run campaigns for many clients across multiple ad platforms hit
three recurring problems:

1. Every platform exports data differently. Meta labels spend "Amount Spent
   (USD)", Google calls it "Cost", TikTok calls it "Spend", and all three use a
   different date format. You cannot compare them until everything is
   standardized.
2. Real exports are dirty. They contain duplicate rows, missing values, and
   impossible numbers such as more clicks than impressions.
3. The agency knows what "normal" performance looks like across its clients, but
   it cannot leak one client's numbers to another.

This project solves all three.

## How it works

The pipeline runs as a series of small Python scripts. Each one reads a file,
transforms it, and writes its own output file, so every stage is a checkpoint
you can open and inspect.

1. `scripts/01_split_platforms.py` takes the source dataset and simulates three
   raw platform exports, each with its own column names, date format, and
   injected messiness (duplicates, missing values, inconsistent casing).
2. `scripts/02_unify.py` maps every platform's columns back to one unified
   schema, standardizes dates to ISO format, and builds a stable campaign_id.
3. `scripts/04_flag_errors.py` runs five quality checks on every row and splits
   the data into clean rows and quarantined rows.
4. `scripts/05_add_clients.py` assigns each row to an anonymous client (A, B, or
   C) based on country, then drops the country column.
5. `scripts/06_portfolio_insights.py` computes cross-client metrics and enforces
   k-anonymity (k=3): any metric drawn from fewer than three distinct clients is
   suppressed.
6. `scripts/07_export_for_web.py` writes the final JSON files the web app reads.

The pipeline and the web app are fully decoupled. Python does all the heavy work
ahead of time and produces static JSON, so the web app is fast and never has
access to raw or non-anonymized data.

## The five data quality checks

Every row is tested against five independent rules. Failing rows are quarantined
into `errors_flagged.csv` and are never used in any downstream calculation.

1. Clicks greater than impressions (mathematically impossible).
2. Negative spend or impressions (data corruption).
3. Missing date, impressions, clicks, or spend.
4. CPM more than 5x the platform's 7-day rolling average (likely anomaly).
5. Duplicate rows (same platform, campaign, and date).

About 88% of rows pass and 12% are flagged.

## K-anonymity

K-anonymity means any published number must be drawn from at least k distinct
sources, so no single one can be reverse-engineered. This project uses k=3.
Before any metric is published, the pipeline checks that at least three distinct
clients contributed to it. If not, the metric is suppressed. Every published
metric carries a client_count field as an audit trail.

## Tech stack

- Data pipeline: Python, pandas, numpy
- Exploratory analysis: Jupyter notebook with plotly (`eda.ipynb`)
- Web app: Next.js, React, TypeScript, Tailwind CSS, Recharts

## Project structure

```
campfire/
  data/
    source/    the original input dataset
    raw/       simulated per-platform exports
    output/    unified, cleaned, anonymized, and aggregated outputs
  scripts/     the numbered pipeline scripts
  eda.ipynb    exploratory data analysis
  web/         the Next.js web app
```

## Running it

Pipeline:

```
pip install -r requirements.txt
python scripts/01_split_platforms.py
python scripts/02_unify.py
python scripts/04_flag_errors.py
python scripts/05_add_clients.py
python scripts/06_portfolio_insights.py
python scripts/07_export_for_web.py
```

Web app:

```
cd web
npm install
npm run dev
```

Then open http://localhost:3000.
