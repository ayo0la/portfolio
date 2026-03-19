# MDFLD Market Tracker — Design Spec

## Overview

A data-first football resale market tracker covering boots, jerseys, and all football categories. Aggregates live listings from 10+ resale sites, tracks price history, and surfaces market intelligence (trending products, top movers, volume stats). Built as a standalone web app first, then integrated into mdfld.co as a market data feature.

Inspired by StockX at inception — the goal is to become the definitive price reference for the football resale market.

---

## Goals

- Give buyers the best available price across all resale sites in one place
- Let sellers and collectors track price movements over time
- Surface market trends: what's appreciating, what's declining, what's being talked about
- Lay the data infrastructure foundation for mdfld.co's market features
- Serve as a portfolio project demonstrating full-stack + data pipeline capability

---

## Out of Scope (v1)

- User accounts, watchlists, price alerts (future)
- Buy/sell transactions (mdfld.co handles this)
- Mobile app
- Email/push notifications
- Authentication model integration (separate FastAPI service, future)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Matches mdfld.co — integration is copy-paste |
| Language | TypeScript | Type safety across scraper → API → UI |
| Database | Supabase (Postgres) | Free tier, pg_cron for scheduling, real-time ready |
| Scraping | Playwright (Node) | Handles JS-heavy sites, native Node, no separate runtime |
| Scraper hosting | Railway (~$5/mo) | No timeout limit — Vercel's 10s timeout kills scrapers |
| Frontend hosting | Vercel | Matches mdfld.co deployment |
| Charting | Recharts or Tremor | Compatible with Next.js App Router, TypeScript-native |

---

## Architecture

```
Browser
  ↕ HTTP
Next.js App (Vercel)
  /            — Market dashboard
  /boots       — Browse boots
  /jerseys     — Browse jerseys
  /product/[slug] — Product detail
  /api/*       — Public API routes
  ↕ Supabase SDK
Supabase (Postgres)
  products · listings · price_history · market_snapshots
  pg_cron (runs market snapshot job after each scrape)
  ↑ writes directly
Railway Scraper Service (persistent Node process)
  index.ts → base.ts → sites/*.ts
  ↓ scrapes
Live Resale Sites (Rareboots, Klekt, eBay, Vinted, Bootroom, etc.)
```

**Key separation:** Railway scraper writes to Supabase. Next.js API routes only read from Supabase. No scrape is ever triggered by an HTTP request.

**mdfld.co integration path:** Same Supabase DB, same `/api/*` routes, UI components rebuilt in HeroUI to match mdfld.co design system. Railway scraper service unchanged.

---

## Data Model

### `products`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
name             text NOT NULL
brand            text NOT NULL
category         text NOT NULL  -- 'boots' | 'jerseys' | 'other'
slug             text UNIQUE NOT NULL
image_url        text
retail_price     numeric        -- original RRP for % above/below retail calc
release_year     int
colorway         text
is_limited_edition boolean DEFAULT false
verification_status text DEFAULT 'unverified'  -- 'unverified' | 'verified' | 'pending'
tags             text[]         -- e.g. ['FG', 'laceless', 'limited']
created_at       timestamptz DEFAULT now()
```

### `listings`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_id          uuid REFERENCES products(id)
site                text NOT NULL   -- 'rareboots' | 'klekt' | 'ebay' etc.
price               numeric NOT NULL
currency            text NOT NULL DEFAULT 'GBP'
url                 text NOT NULL
size_uk             text
size_eu             text
size_us             text
condition           text            -- 'new' | 'used'
condition_notes     text
in_stock            boolean DEFAULT true
listing_id_external text            -- ID on source site (prevents duplicate rows)
listed_at           timestamptz     -- when item was first posted on source site
shipping_cost       numeric
seller_rating       numeric
last_price          numeric         -- previous recorded price
images              text[]          -- image URLs from listing
scraped_at          timestamptz DEFAULT now()
```

### `price_history`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_id       uuid REFERENCES products(id)
site             text NOT NULL
price            numeric NOT NULL
currency         text NOT NULL DEFAULT 'GBP'
price_gbp        numeric          -- normalised to GBP
price_change_pct numeric          -- % change from previous record
recorded_at      timestamptz DEFAULT now()
```

### `market_snapshots`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
category         text NOT NULL   -- 'boots' | 'jerseys' | 'all'
metric           text NOT NULL   -- 'avg_price' | 'volume' | 'top_mover' | 'trending'
value            jsonb NOT NULL
volume_7d        numeric
price_change_7d  numeric
trending_score   numeric
recorded_at      timestamptz DEFAULT now()
```

---

## Scraper Architecture

### Structure (Railway service)
```
scraper/
  index.ts          — orchestrator: runs all scrapers, handles schedule (every 6h)
  base.ts           — shared Playwright logic: browser launch, retry, rate limiting,
                      user-agent rotation, error handling
  db.ts             — Supabase write helpers: upsert products, listings, price_history
  types.ts          — ScrapedListing, Product, ScrapeResult interfaces
  normalise.ts      — currency conversion, size normalisation (UK/EU/US),
                      condition string mapping
  sites/
    rareboots.ts
    bootroom.ts
    bootchamber.ts
    klekt.ts
    vinted.ts
    ebay.ts
    classicfootballshirts.ts
    vintagefootballshirts.ts
    depop.ts
    footballshirtculture.ts
    retrofootballkits.ts
    (+ more added by dropping a new file implementing Scraper interface)
```

### Scraper interface
```ts
interface Scraper {
  name: string                          // site identifier stored in DB
  scrape(): Promise<ScrapedListing[]>
}

interface ScrapedListing {
  product_name: string
  brand: string
  category: 'boots' | 'jerseys' | 'other'
  price: number
  currency: string
  url: string
  size_uk?: string
  size_eu?: string
  size_us?: string
  condition: 'new' | 'used'
  condition_notes?: string
  listing_id_external?: string
  listed_at?: Date
  shipping_cost?: number
  seller_rating?: number
  images?: string[]
}
```

### Schedule
- Full scrape (all sites): every 6 hours via Railway cron
- Market snapshot computation: runs immediately after each full scrape completes
- `market_snapshots` is populated by a DB function triggered post-scrape

### Adding a new site
1. Create `scraper/sites/newsite.ts` implementing the `Scraper` interface
2. Register it in `scraper/index.ts`
3. Deploy — nothing else changes

---

## API Routes

All routes are read-only. No route triggers a scrape.

```
GET /api/products
  Query params: category, brand, tags, limit, offset
  Returns: Product[] with lowest current price per product

GET /api/products/[slug]
  Returns: Product + current best listing per site + stats

GET /api/listings
  Query params: product_id, site, condition, size_uk, min_price, max_price
  Returns: Listing[] sorted by price ascending

GET /api/price-history/[productId]
  Query params: days (default 30), site
  Returns: PriceHistoryPoint[] for charting

GET /api/market
  Returns: latest market_snapshots for all categories — trending, top movers,
           avg price, 7d volume, 7d price change

GET /api/market/category/[category]
  Returns: category-level market_snapshots for boots | jerseys | other
```

---

## Pages & UI

### Design language
- Dark background (#0a0a0a), gold accent (#ffd700), monospace typography
- Terminal-dense for data tables, card-based for visual browsing
- Matches aesthetic of the standalone portfolio — intentional visual continuity

### `/` — Market Dashboard
- **Stats bar** (4 blocks): total listings, avg price, sites tracked, 7-day market change
- **Top Movers table**: product name, lowest price, avg price, 7-day % change — terminal dense
- **Trending cards** (3-column grid): product image, name, lowest price, % change, site count

### `/boots` and `/jerseys` — Browse Pages
- Filter sidebar: brand, size (UK), condition, price range, in-stock only
- Product grid: image, name, lowest price, % change badge, site count
- Pagination

### `/product/[slug]` — Product Detail Page
- **Hero section**: product name, brand/category breadcrumb
- **Hero price block**: lowest price (large, gold), avg price, retail price, 7-day change, sites listing count
- **Price history chart**: line chart, one line per site, 30-day default (7d / 30d / 90d / all toggle)
  - Gold fill area under lowest-price line
  - Site legend
- **Size selector**: UK sizes as pill buttons, filters listings below
- **Listings table**: sorted by price, best price highlighted with gold left border
  - Columns: site, condition, shipping, price, VIEW → link

---

## File Structure (Next.js app)

```
mdfld-market-tracker/
  app/
    page.tsx                    — dashboard
    boots/page.tsx
    jerseys/page.tsx
    product/[slug]/page.tsx
    api/
      products/route.ts
      products/[slug]/route.ts
      listings/route.ts
      price-history/[productId]/route.ts
      market/route.ts
      market/category/[category]/route.ts
  components/
    dashboard/
      StatsBar.tsx
      TopMoversTable.tsx
      TrendingCards.tsx
    product/
      HeroPrice.tsx
      PriceHistoryChart.tsx
      SizeSelector.tsx
      ListingsTable.tsx
    browse/
      FilterSidebar.tsx
      ProductGrid.tsx
      ProductCard.tsx
    ui/
      Nav.tsx
      Footer.tsx
  lib/
    supabase.ts                 — Supabase client
    types.ts                    — shared TypeScript interfaces
  scraper/                      — Railway service (same repo, separate deploy target)
    index.ts
    base.ts
    db.ts
    types.ts
    normalise.ts
    sites/
      rareboots.ts
      bootroom.ts
      ...
```

---

## Integration into mdfld.co (future)

1. mdfld.co connects to the same Supabase project (env var swap)
2. `/api/*` routes either migrate into mdfld.co or remain as a separate service called via fetch
3. UI components are rebuilt in HeroUI (mdfld.co's component library) — same data, different skin
4. Railway scraper service is untouched
5. `verification_status` field on `products` connects to the MDFLD authentication model badge

---

## Success Criteria

- Dashboard loads in < 2s with real data
- Price history chart renders correctly for any product with > 7 days of data
- Listings table correctly surfaces the lowest price with gold highlight
- Adding a new scraper requires only one new file
- `/api/*` routes return valid JSON consumable by mdfld.co without modification
- Zero console errors in production build
