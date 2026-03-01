# Lead Collection Scripts

Scripts to collect leads (names, Twitter, websites) and optionally enrich with emails. Output: CSV for use with cold email services (Lemlist, Instantly, etc.).

## Quick Start

```bash
# 1. HN only (no API keys) — ~2000 Show HN authors
node scripts/collect-leads/hn-show.mjs

# 2. Merge (combines PH + HN if both exist)
node scripts/collect-leads/merge.mjs

# 3. Run all (HN + PH if token set + merge + Hunter if key set)
node scripts/collect-leads/run-all.mjs
```

## Output Files

| File | Description |
|------|-------------|
| `output-hn.csv` | Hacker News Show HN authors |
| `output-ph.csv` | Product Hunt makers (needs token) |
| `output-merged.csv` | Deduplicated merge of all sources |
| `output-enriched.csv` | Merged + Hunter.io emails (needs Hunter key) |

## API Keys (optional)

Add to `.env`:

```env
# Product Hunt — get at https://www.producthunt.com/v2/oauth/applications
PRODUCT_HUNT_TOKEN=your_token

# Hunter.io — free 25/mo at hunter.io
HUNTER_API_KEY=your_key
```

**Note:** PH restricts commercial use. Contact hello@producthunt.com for approval before bulk outreach.

## CSV Columns

- `name` — Display name
- `username` — PH/HN username
- `twitter` — Twitter URL
- `website` — Product or personal site
- `product` — Product name
- `product_url` — Link to product
- `source` — producthunt | hackernews
- `email` — (after Hunter enrich)

## Sending Cold Emails

Use a service that handles compliance (CAN-SPAM, unsubscribe, etc.):

- **Lemlist** — lemlist.com
- **Instantly** — instantly.ai
- **Smartlead** — smartlead.ai
- **Apollo** — apollo.io (has built-in leads + email)

Import `output-enriched.csv` (or `output-merged.csv`). Personalize subject/body. Include unsubscribe link and physical address (required by CAN-SPAM).

## Compliance

- **CAN-SPAM (US):** Include unsubscribe, physical address, accurate "From" name
- **GDPR (EU):** Be cautious emailing EU residents without consent
- **Best practice:** Keep lists under 100/day when starting; warm up your domain
