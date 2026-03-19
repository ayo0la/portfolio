# MDFLD Market Tracker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a data-first football resale market tracker — listing aggregator, price history, and market intelligence dashboard — as a standalone Next.js app that will later integrate into mdfld.co.

**Architecture:** Railway scraper service writes listings from 10+ resale sites into Supabase (Postgres). Next.js on Vercel exposes read-only API routes consumed by four pages: dashboard, /boots, /jerseys, /product/[slug]. No HTTP request ever triggers a scrape.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres), Playwright, Vitest, Recharts, Railway, Vercel

**Spec:** `docs/superpowers/specs/2026-03-18-mdfld-market-tracker-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `lib/supabase.ts` | Supabase client (browser-safe anon key) |
| `lib/types.ts` | Shared TypeScript interfaces used by API and UI |
| `lib/normalise.ts` | Slug generation, currency conversion, size/condition normalisation |
| `scraper/types.ts` | ScrapedListing, Scraper interfaces (scraper-only) |
| `scraper/base.ts` | Playwright browser management, retry, rate limiting, user-agent rotation |
| `scraper/db.ts` | Supabase write helpers: upsert products, listings, price_history |
| `scraper/normalise.ts` | Re-exports `lib/normalise.ts` (scraper uses same normalisation) |
| `scraper/index.ts` | Orchestrator: runs all scrapers every 6h, triggers snapshot computation |
| `scraper/sites/rareboots.ts` | Rareboots scraper |
| `scraper/sites/bootroom.ts` | Online Bootroom scraper |
| `scraper/sites/bootchamber.ts` | The Boot Chamber scraper |
| `scraper/sites/klekt.ts` | Klekt scraper |
| `scraper/sites/vinted.ts` | Vinted scraper (football boots/jerseys filter) |
| `scraper/sites/ebay.ts` | eBay scraper (category search) |
| `scraper/sites/classicfootballshirts.ts` | Classic Football Shirts scraper |
| `scraper/sites/vintagefootballshirts.ts` | Vintage Football Shirts scraper |
| `scraper/sites/depop.ts` | Depop scraper |
| `scraper/sites/footballshirtculture.ts` | Football Shirt Culture scraper |
| `app/api/products/route.ts` | GET /api/products |
| `app/api/products/[slug]/route.ts` | GET /api/products/[slug] |
| `app/api/listings/route.ts` | GET /api/listings |
| `app/api/price-history/[productId]/route.ts` | GET /api/price-history/[productId] |
| `app/api/market/route.ts` | GET /api/market |
| `app/api/market/category/[category]/route.ts` | GET /api/market/category/[category] |
| `app/page.tsx` | Dashboard page |
| `app/boots/page.tsx` | Boots browse page |
| `app/jerseys/page.tsx` | Jerseys browse page |
| `app/product/[slug]/page.tsx` | Product detail page |
| `components/dashboard/StatsBar.tsx` | 4-block stats bar |
| `components/dashboard/TopMoversTable.tsx` | Terminal-dense top movers table |
| `components/dashboard/TrendingCards.tsx` | 3-column trending product cards |
| `components/browse/BrowsePage.tsx` | Shared browse page (category prop) |
| `components/browse/FilterSidebar.tsx` | Brand/size/condition/price filters |
| `components/browse/ProductGrid.tsx` | Product card grid with pagination |
| `components/browse/ProductCard.tsx` | Single product card |
| `components/product/HeroPrice.tsx` | Hero price block (lowest, avg, retail, 7d) |
| `components/product/PriceHistoryChart.tsx` | Recharts line chart, per-site lines |
| `components/product/SizeSelector.tsx` | UK size pill buttons |
| `components/product/ListingsTable.tsx` | Sorted listings, gold best-price highlight |
| `components/ui/Nav.tsx` | Top navigation bar |
| `components/ui/Footer.tsx` | Footer |
| `supabase/migrations/001_initial_schema.sql` | All 5 tables + constraints |

---

## Task 1: Project Scaffold

**Files:**
- Create: `mdfld-market-tracker/` (new project at `/Users/ayoola/Desktop/mdfld-market-tracker`)
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.local.example`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/ayoola/Desktop
npx create-next-app@latest mdfld-market-tracker \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd mdfld-market-tracker
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js recharts
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/node
npm install --save-dev playwright @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 4: Create vitest.setup.ts**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create .env.local.example**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Scraper service only (never expose to browser)
SUPABASE_SERVICE_KEY=your-service-role-key
```

Copy to `.env.local` and fill in your Supabase project credentials.

- [ ] **Step 7: Create lib/supabase.ts**

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 8: Initialise git and commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 project with Vitest and Supabase client"
```

---

## Task 2: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Exchange rates (refreshed daily, used by scraper normalisation)
CREATE TABLE exchange_rates (
  currency     text PRIMARY KEY,
  rate_to_gbp  numeric NOT NULL,
  updated_at   timestamptz DEFAULT now()
);
INSERT INTO exchange_rates (currency, rate_to_gbp) VALUES
  ('GBP', 1.0),
  ('EUR', 0.86),
  ('USD', 0.79);

-- Products (deduplicated across all sites)
CREATE TABLE products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  brand               text NOT NULL,
  category            text NOT NULL CHECK (category IN ('boots', 'jerseys', 'other')),
  slug                text UNIQUE NOT NULL,
  image_url           text,
  retail_price        numeric,
  release_year        int,
  colorway            text,
  is_limited_edition  boolean DEFAULT false,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'pending')),
  tags                text[],
  created_at          timestamptz DEFAULT now()
);

-- Live listings (refreshed every scrape run)
CREATE TABLE listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid REFERENCES products(id) ON DELETE CASCADE,
  site                text NOT NULL,
  price               numeric NOT NULL,
  currency            text NOT NULL DEFAULT 'GBP',
  url                 text NOT NULL,
  size_uk             text,
  size_eu             text,
  size_us             text,
  condition           text CHECK (condition IN ('new', 'used')),
  condition_notes     text,
  in_stock            boolean DEFAULT true,
  listing_id_external text,
  listed_at           timestamptz,
  shipping_cost       numeric,
  seller_rating       numeric,
  last_price          numeric,
  images              text[],
  scraped_at          timestamptz DEFAULT now(),
  CONSTRAINT listings_external_id_unique UNIQUE (site, listing_id_external) DEFERRABLE,
  CONSTRAINT listings_url_unique UNIQUE (site, url)
);

-- Append-only price history (one row per product+site per scrape cycle)
CREATE TABLE price_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid REFERENCES products(id) ON DELETE CASCADE,
  site             text NOT NULL,
  price            numeric NOT NULL,
  currency         text NOT NULL DEFAULT 'GBP',
  price_gbp        numeric,
  price_change_pct numeric,
  size_uk          text,
  recorded_at      timestamptz DEFAULT now()
);
CREATE INDEX price_history_product_site_idx ON price_history (product_id, site, recorded_at DESC);

-- Market snapshots (computed after each scrape run)
CREATE TABLE market_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category         text NOT NULL CHECK (category IN ('boots', 'jerseys', 'other', 'all')),
  metric           text NOT NULL CHECK (metric IN ('avg_price', 'volume', 'top_mover', 'trending')),
  value            jsonb NOT NULL,
  volume_7d        numeric,
  price_change_7d  numeric,
  trending_score   numeric,
  recorded_at      timestamptz DEFAULT now()
);
CREATE INDEX market_snapshots_latest_idx ON market_snapshots (category, metric, recorded_at DESC);
```

- [ ] **Step 2: Apply schema to Supabase**

In the Supabase dashboard → SQL Editor, paste and run the migration.

Expected: 5 tables created — `exchange_rates`, `products`, `listings`, `price_history`, `market_snapshots`.

Verify: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema — 5 tables with constraints and indexes"
```

---

## Task 3: Shared Types + normalise.ts

**Files:**
- Create: `lib/types.ts`
- Create: `lib/normalise.ts`
- Create: `lib/__tests__/normalise.test.ts`

- [ ] **Step 1: Create lib/types.ts**

```ts
// lib/types.ts

export type Category = 'boots' | 'jerseys' | 'other'
export type Condition = 'new' | 'used'
export type VerificationStatus = 'unverified' | 'verified' | 'pending'

export interface Product {
  id: string
  name: string
  brand: string
  category: Category
  slug: string
  image_url: string | null
  retail_price: number | null
  release_year: number | null
  colorway: string | null
  is_limited_edition: boolean
  verification_status: VerificationStatus
  tags: string[]
  created_at: string
  // Computed fields (from API joins)
  lowest_price?: number
  avg_price?: number
  price_change_7d?: number
  site_count?: number
}

export interface Listing {
  id: string
  product_id: string
  site: string
  price: number
  currency: string
  url: string
  size_uk: string | null
  size_eu: string | null
  size_us: string | null
  condition: Condition | null
  condition_notes: string | null
  in_stock: boolean
  listing_id_external: string | null
  listed_at: string | null
  shipping_cost: number | null
  seller_rating: number | null
  last_price: number | null
  images: string[]
  scraped_at: string
}

export interface PriceHistoryPoint {
  recorded_at: string
  price_gbp: number
  site: string
}

export interface MarketSnapshot {
  id: string
  category: string
  metric: string
  value: Record<string, unknown>
  volume_7d: number | null
  price_change_7d: number | null
  trending_score: number | null
  recorded_at: string
}
```

- [ ] **Step 2: Write failing tests for normalise.ts**

```ts
// lib/__tests__/normalise.test.ts
import { describe, it, expect } from 'vitest'
import {
  generateSlug,
  normaliseCurrency,
  normaliseCondition,
  normaliseSizeUk,
} from '../normalise'

describe('generateSlug', () => {
  it('generates lowercase hyphenated slug from brand + name', () => {
    expect(generateSlug('Nike', 'Mercurial Superfly IX Elite')).toBe(
      'nike-mercurial-superfly-ix-elite'
    )
  })

  it('includes colorway when provided', () => {
    expect(generateSlug('Nike', 'Mercurial Superfly IX', 'Blackout')).toBe(
      'nike-mercurial-superfly-ix-blackout'
    )
  })

  it('strips special characters', () => {
    expect(generateSlug('Adidas', 'Predator Elite+ FG', undefined)).toBe(
      'adidas-predator-elite-fg'
    )
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('Nike', 'Air  Max  360')).toBe('nike-air-max-360')
  })
})

describe('normaliseCurrency', () => {
  const rates = { GBP: 1, EUR: 0.86, USD: 0.79 }

  it('returns price unchanged for GBP', () => {
    expect(normaliseCurrency(100, 'GBP', rates)).toBe(100)
  })

  it('converts EUR to GBP', () => {
    expect(normaliseCurrency(100, 'EUR', rates)).toBe(86)
  })

  it('converts USD to GBP', () => {
    expect(normaliseCurrency(100, 'USD', rates)).toBe(79)
  })

  it('defaults to GBP for unknown currency', () => {
    expect(normaliseCurrency(100, 'JPY', rates)).toBe(100)
  })
})

describe('normaliseCondition', () => {
  it('maps "new" variants to new', () => {
    expect(normaliseCondition('Brand New')).toBe('new')
    expect(normaliseCondition('BNIB')).toBe('new')
    expect(normaliseCondition('Unworn')).toBe('new')
  })

  it('maps everything else to used', () => {
    expect(normaliseCondition('Good condition')).toBe('used')
    expect(normaliseCondition('Well worn')).toBe('used')
  })
})

describe('normaliseSizeUk', () => {
  it('extracts numeric size from string', () => {
    expect(normaliseSizeUk('UK 9')).toBe('9')
    expect(normaliseSizeUk('Size 10.5')).toBe('10.5')
  })

  it('returns null for empty or unparseable input', () => {
    expect(normaliseSizeUk('')).toBeNull()
    expect(normaliseSizeUk('One size')).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run lib/__tests__/normalise.test.ts
```

Expected: FAIL — `Cannot find module '../normalise'`

- [ ] **Step 4: Implement lib/normalise.ts**

```ts
// lib/normalise.ts

export function generateSlug(brand: string, name: string, colorway?: string): string {
  const parts = [brand, name, colorway].filter(Boolean) as string[]
  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function normaliseCurrency(
  price: number,
  currency: string,
  rates: Record<string, number>
): number {
  const rate = rates[currency] ?? 1
  return Math.round(price * rate * 100) / 100
}

export function normaliseCondition(raw: string): 'new' | 'used' {
  const lower = raw.toLowerCase()
  if (lower.includes('new') || lower.includes('unworn') || lower.includes('bnib')) {
    return 'new'
  }
  return 'used'
}

export function normaliseSizeUk(raw: string): string | null {
  const match = raw.match(/\d+\.?\d*/)
  return match ? match[0] : null
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run lib/__tests__/normalise.test.ts
```

Expected: 11 tests passing.

- [ ] **Step 6: Commit**

```bash
git add lib/
git commit -m "feat: add shared types and normalise utilities with full test coverage"
```

---

## Task 4: Scraper Foundation — types, base, db

**Files:**
- Create: `scraper/types.ts`
- Create: `scraper/base.ts`
- Create: `scraper/db.ts`
- Create: `scraper/__tests__/normalise.test.ts`
- Create: `scraper/__tests__/db.test.ts`

- [ ] **Step 1: Create scraper/types.ts**

```ts
// scraper/types.ts

export interface ScrapedListing {
  product_name: string
  brand: string
  category: 'boots' | 'jerseys' | 'other'
  price: number
  currency: string
  url: string
  size_uk?: string
  size_eu?: string
  size_us?: string
  condition: string   // raw string — normalised by db.ts
  condition_notes?: string
  listing_id_external?: string
  listed_at?: Date
  shipping_cost?: number
  seller_rating?: number
  images?: string[]
}

export interface Scraper {
  name: string
  scrape(): Promise<ScrapedListing[]>
}
```

- [ ] **Step 2: Create scraper/base.ts**

```ts
// scraper/base.ts
import { chromium, Browser, Page } from 'playwright'

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
]

export class BaseScraper {
  protected browser: Browser | null = null

  async launch(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
  }

  async close(): Promise<void> {
    await this.browser?.close()
    this.browser = null
  }

  async newPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not launched — call launch() first')
    const page = await this.browser.newPage()
    await page.setExtraHTTPHeaders({
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    })
    return page
  }

  async withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
        }
      }
    }
    throw lastError
  }

  // Rate limiting: pause between requests to avoid ban
  async rateLimit(ms = 1500): Promise<void> {
    const jitter = Math.random() * 500
    await new Promise(r => setTimeout(r, ms + jitter))
  }
}
```

- [ ] **Step 3: Write failing tests for db.ts**

```ts
// scraper/__tests__/db.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing db.ts
const mockUpsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'product-uuid-1' }, error: null }),
  }),
})
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

// Also mock env vars
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-key')

import { upsertListing } from '../db'
import type { ScrapedListing } from '../types'

const mockListing: ScrapedListing = {
  product_name: 'Mercurial Superfly IX Elite FG',
  brand: 'Nike',
  category: 'boots',
  price: 340,
  currency: 'GBP',
  url: 'https://rareboots.com/listings/123',
  size_uk: '9',
  condition: 'new',
  listing_id_external: 'RB-123',
}

describe('upsertListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock chain
    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'product-uuid-1' }, error: null }),
      }),
    })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('calls products upsert with correct slug', async () => {
    await upsertListing(mockListing, 'rareboots')
    expect(mockFrom).toHaveBeenCalledWith('products')
    const firstCall = mockUpsert.mock.calls[0][0]
    expect(firstCall.slug).toBe('nike-mercurial-superfly-ix-elite-fg')
  })

  it('calls listings upsert with site and price', async () => {
    await upsertListing(mockListing, 'rareboots')
    expect(mockFrom).toHaveBeenCalledWith('listings')
    const listingCall = mockUpsert.mock.calls[1][0]
    expect(listingCall.site).toBe('rareboots')
    expect(listingCall.price).toBe(340)
  })

  it('normalises condition string to "new"', async () => {
    await upsertListing(mockListing, 'rareboots')
    const listingCall = mockUpsert.mock.calls[1][0]
    expect(listingCall.condition).toBe('new')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npx vitest run scraper/__tests__/db.test.ts
```

Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 5: Create scraper/db.ts**

```ts
// scraper/db.ts
import { createClient } from '@supabase/supabase-js'
import type { ScrapedListing } from './types'
import { generateSlug, normaliseCondition } from '../lib/normalise'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Named export used by the orchestrator for snapshot queries
export const supabaseAdmin = supabase

export async function upsertListing(raw: ScrapedListing, site: string): Promise<void> {
  const slug = generateSlug(raw.brand, raw.product_name)

  // 1. Upsert product
  const { data: product, error: productError } = await supabase
    .from('products')
    .upsert(
      {
        name: raw.product_name,
        brand: raw.brand,
        category: raw.category,
        slug,
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (productError || !product) {
    console.error(`Failed to upsert product ${slug}:`, productError)
    return
  }

  // 2. Upsert listing
  const listingRow = {
    product_id: product.id,
    site,
    price: raw.price,
    currency: raw.currency,
    url: raw.url,
    size_uk: raw.size_uk ?? null,
    size_eu: raw.size_eu ?? null,
    size_us: raw.size_us ?? null,
    condition: normaliseCondition(raw.condition),
    condition_notes: raw.condition_notes ?? null,
    listing_id_external: raw.listing_id_external ?? null,
    listed_at: raw.listed_at?.toISOString() ?? null,
    shipping_cost: raw.shipping_cost ?? null,
    seller_rating: raw.seller_rating ?? null,
    images: raw.images ?? [],
    in_stock: true,
    scraped_at: new Date().toISOString(),
  }

  const conflict = raw.listing_id_external
    ? 'site,listing_id_external'
    : 'site,url'

  await supabase.from('listings').upsert(listingRow, { onConflict: conflict })
}

export async function writePriceHistory(
  productId: string,
  site: string,
  price: number,
  currency: string,
  sizeUk: string | null
): Promise<void> {
  // Fetch exchange rate
  const { data: rateRow } = await supabase
    .from('exchange_rates')
    .select('rate_to_gbp')
    .eq('currency', currency)
    .single()

  const rate = rateRow?.rate_to_gbp ?? 1
  const price_gbp = Math.round(price * rate * 100) / 100

  // Fetch previous price_gbp for this product+site to compute change
  const { data: prev } = await supabase
    .from('price_history')
    .select('price_gbp')
    .eq('product_id', productId)
    .eq('site', site)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const price_change_pct = prev?.price_gbp
    ? Math.round(((price_gbp - prev.price_gbp) / prev.price_gbp) * 10000) / 100
    : null

  await supabase.from('price_history').insert({
    product_id: productId,
    site,
    price,
    currency,
    price_gbp,
    price_change_pct,
    size_uk: sizeUk,
    recorded_at: new Date().toISOString(),
  })
}

export async function markStaleListings(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('listings')
    .update({ in_stock: false })
    .lt('scraped_at', cutoff)
    .eq('in_stock', true)
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run scraper/__tests__/db.test.ts
```

Expected: 3 tests passing.

- [ ] **Step 7: Commit**

```bash
git add scraper/types.ts scraper/base.ts scraper/db.ts scraper/__tests__/
git commit -m "feat: add scraper foundation — types, base Playwright class, and db write helpers"
```

---

## Task 5: Site Scrapers — Rareboots, Bootroom, Bootchamber

**Files:**
- Create: `scraper/sites/rareboots.ts`
- Create: `scraper/sites/bootroom.ts`
- Create: `scraper/sites/bootchamber.ts`

These scrapers use real sites — test by running them directly and inspecting output. No automated browser tests.

- [ ] **Step 1: Create scraper/sites/rareboots.ts**

```ts
// scraper/sites/rareboots.ts
import { BaseScraper } from '../base'
import type { ScrapedListing, Scraper } from '../types'

export class RareboostsScraper extends BaseScraper implements Scraper {
  name = 'rareboots'

  async scrape(): Promise<ScrapedListing[]> {
    await this.launch()
    const listings: ScrapedListing[] = []

    try {
      const page = await this.newPage()
      // Scrape listings page by page (boots first)
      let url = 'https://www.rareboots.com/marketplace'
      let hasNext = true

      while (hasNext) {
        await this.withRetry(() => page.goto(url, { waitUntil: 'networkidle' }))

        const items = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('[data-listing]')).map(el => ({
            title: el.querySelector('.listing-title')?.textContent?.trim() ?? '',
            price: parseFloat(
              el.querySelector('.listing-price')?.textContent?.replace(/[^0-9.]/g, '') ?? '0'
            ),
            url: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
            size: el.querySelector('.listing-size')?.textContent?.trim() ?? '',
            condition: el.querySelector('.listing-condition')?.textContent?.trim() ?? 'used',
            id: el.getAttribute('data-listing') ?? undefined,
            images: [
              (el.querySelector('img') as HTMLImageElement)?.src ?? '',
            ].filter(Boolean),
          }))
        })

        for (const item of items) {
          if (!item.url || !item.price) continue
          listings.push({
            product_name: item.title,
            brand: extractBrand(item.title),
            category: 'boots',
            price: item.price,
            currency: 'GBP',
            url: item.url,
            size_uk: item.size || undefined,
            condition: item.condition,
            listing_id_external: item.id,
            images: item.images,
          })
        }

        // Check for next page
        const nextBtn = await page.$('[aria-label="Next page"]:not([disabled])')
        if (nextBtn) {
          url = await page.evaluate(el => (el as HTMLAnchorElement).href, nextBtn)
          await this.rateLimit()
        } else {
          hasNext = false
        }
      }

      await page.close()
    } finally {
      await this.close()
    }

    return listings
  }
}

function extractBrand(title: string): string {
  const brands = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Mizuno', 'Under Armour', 'Asics']
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) return brand
  }
  return 'Unknown'
}
```

> **Note:** The selectors above are illustrative. Before deploying, manually inspect `rareboots.com` in browser DevTools to confirm actual CSS selectors and adjust. The scraping logic pattern (pagination loop, evaluate, rateLimit) is the template — selectors are site-specific.

- [ ] **Step 2: Create scraper/sites/bootroom.ts**

Follow the same pattern as rareboots.ts. Key differences:
- `name = 'bootroom'`
- Base URL: `https://www.onlinebootroom.com`
- Inspect selectors at the site and update accordingly

```ts
// scraper/sites/bootroom.ts
import { BaseScraper } from '../base'
import type { ScrapedListing, Scraper } from '../types'

export class BootroomScraper extends BaseScraper implements Scraper {
  name = 'bootroom'

  async scrape(): Promise<ScrapedListing[]> {
    await this.launch()
    const listings: ScrapedListing[] = []
    try {
      const page = await this.newPage()
      await this.withRetry(() =>
        page.goto('https://www.onlinebootroom.com/sale', { waitUntil: 'networkidle' })
      )
      // TODO: update selectors after inspecting the live site
      const items = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.product-item')).map(el => ({
          title: el.querySelector('.product-title')?.textContent?.trim() ?? '',
          price: parseFloat(
            el.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') ?? '0'
          ),
          url: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          condition: 'new',
        }))
      )
      for (const item of items) {
        if (!item.url || !item.price) continue
        listings.push({
          product_name: item.title,
          brand: 'Unknown',
          category: 'boots',
          price: item.price,
          currency: 'GBP',
          url: item.url,
          condition: item.condition,
        })
      }
      await page.close()
    } finally {
      await this.close()
    }
    return listings
  }
}
```

- [ ] **Step 3: Create scraper/sites/bootchamber.ts**

Same pattern. `name = 'bootchamber'`, target `https://thebootchamber.com`. Update selectors after live inspection.

- [ ] **Step 4: Manual verification**

Create a temporary test script to run a single scraper and print results:

```ts
// scraper/test-run.ts  (delete after verification)
import { RareboostsScraper } from './sites/rareboots'

async function main() {
  const scraper = new RareboostsScraper()
  const listings = await scraper.scrape()
  console.log(`Scraped ${listings.length} listings`)
  console.log(JSON.stringify(listings.slice(0, 3), null, 2))
}

main().catch(console.error)
```

```bash
npx tsx scraper/test-run.ts
```

Expected: JSON output with at least one listing containing product_name, price, url.

- [ ] **Step 5: Commit**

```bash
git add scraper/sites/
git commit -m "feat: add Rareboots, Bootroom, and Bootchamber scrapers"
```

---

## Task 6: Site Scrapers — Klekt, Vinted, eBay, Classic Football Shirts, and more

**Files:**
- Create: `scraper/sites/klekt.ts`
- Create: `scraper/sites/vinted.ts`
- Create: `scraper/sites/ebay.ts`
- Create: `scraper/sites/classicfootballshirts.ts`
- Create: `scraper/sites/vintagefootballshirts.ts`
- Create: `scraper/sites/depop.ts`
- Create: `scraper/sites/footballshirtculture.ts`

Each file follows the identical pattern established in Task 5. Key per-site notes:

**klekt.ts** — `name = 'klekt'`, target `https://www.klekt.com/sneakers-sportswear/football-boots`. Category: boots + jerseys.

**vinted.ts** — `name = 'vinted'`, target `https://www.vinted.co.uk` with search query `football boots`. Note: Vinted has anti-scraping measures — use `waitForSelector` with longer timeout and slower `rateLimit(3000)`.

**ebay.ts** — `name = 'ebay'`, target eBay search for "football boots" and "football shirt" with `Buy It Now` filter. Extract `seller_rating` from listing data.

**classicfootballshirts.ts** — `name = 'classicfootballshirts'`, target `https://www.classicfootballshirts.co.uk`. Category: jerseys.

**vintagefootballshirts.ts** — `name = 'vintagefootballshirts'`, target `https://www.vintagefootballshirts.com`. Category: jerseys.

**depop.ts** — `name = 'depop'`, use Depop's search API endpoint (inspect network requests in browser) rather than DOM scraping — it returns JSON directly.

**footballshirtculture.ts** — `name = 'footballshirtculture'`, target `https://www.footballshirtculture.com`. Category: jerseys.

- [ ] **Step 1: Create each scraper file using the Task 5 pattern**

For each file:
1. Copy the bootroom.ts template
2. Update `name`, base URL, selectors
3. Update `category` (boots vs jerseys)
4. Inspect the live site in browser DevTools to confirm selectors

- [ ] **Step 2: Manual verification for each new scraper**

```bash
# Update test-run.ts to test each new scraper, e.g.:
import { KlektScraper } from './sites/klekt'
const scraper = new KlektScraper()
const listings = await scraper.scrape()
console.log(`Klekt: ${listings.length} listings`)
```

Run for each scraper. Expected: > 0 listings with valid price and url.

- [ ] **Step 3: Commit**

```bash
git add scraper/sites/
git commit -m "feat: add Klekt, Vinted, eBay, Classic Football Shirts, Vintage Football Shirts, Depop, Football Shirt Culture scrapers"
```

---

## Task 7: Scraper Orchestrator + Railway Config

**Files:**
- Create: `scraper/index.ts`
- Create: `scraper/package.json` (Railway deploy target)
- Create: `railway.json`
- Delete: `scraper/test-run.ts`

- [ ] **Step 1: Create scraper/index.ts**

```ts
// scraper/index.ts
import { RareboostsScraper } from './sites/rareboots'
import { BootroomScraper } from './sites/bootroom'
import { BootchamberScraper } from './sites/bootchamber'
import { KlektScraper } from './sites/klekt'
import { VintedScraper } from './sites/vinted'
import { EbayScraper } from './sites/ebay'
import { ClassicFootballShirtsScraper } from './sites/classicfootballshirts'
import { VintageFootballShirtsScraper } from './sites/vintagefootballshirts'
import { DepopScraper } from './sites/depop'
import { FootballShirtCultureScraper } from './sites/footballshirtculture'
import { upsertListing, writePriceHistory, markStaleListings } from './db'
import { supabaseAdmin } from './db'
import type { Scraper } from './types'

const SCRAPERS: Scraper[] = [
  new RareboostsScraper(),
  new BootroomScraper(),
  new BootchamberScraper(),
  new KlektScraper(),
  new VintedScraper(),
  new EbayScraper(),
  new ClassicFootballShirtsScraper(),
  new VintageFootballShirtsScraper(),
  new DepopScraper(),
  new FootballShirtCultureScraper(),
]

async function runScrape(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting full scrape`)

  for (const scraper of SCRAPERS) {
    console.log(`  Scraping: ${scraper.name}`)
    try {
      const listings = await scraper.scrape()
      console.log(`  ${scraper.name}: ${listings.length} listings`)

      for (const listing of listings) {
        await upsertListing(listing, scraper.name)
      }
    } catch (err) {
      console.error(`  ${scraper.name} failed:`, err)
      // Continue with next scraper — one failure should not stop the run
    }
  }

  await markStaleListings()
  await computeMarketSnapshots()

  console.log(`[${new Date().toISOString()}] Scrape complete`)
}

async function computeMarketSnapshots(): Promise<void> {
  // Compute and insert snapshots for 'all', 'boots', 'jerseys'
  for (const category of ['all', 'boots', 'jerseys'] as const) {
    const categoryFilter = category === 'all' ? {} : { category }

    // avg_price
    const { data: avgData } = await supabaseAdmin
      .from('listings')
      .select('price, products!inner(category)')
      .eq('in_stock', true)
      .match(category === 'all' ? {} : { 'products.category': category })

    const prices = (avgData ?? []).map((r: { price: number }) => r.price)
    const avg = prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0

    await supabaseAdmin.from('market_snapshots').insert({
      category,
      metric: 'avg_price',
      value: { price: Math.round(avg * 100) / 100 },
      price_change_7d: null,
      recorded_at: new Date().toISOString(),
    })

    // volume
    await supabaseAdmin.from('market_snapshots').insert({
      category,
      metric: 'volume',
      value: { count: prices.length },
      volume_7d: prices.length,
      recorded_at: new Date().toISOString(),
    })

    // top_mover: products with highest 7-day price change in price_history
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: historyData } = await supabaseAdmin
      .from('price_history')
      .select('product_id, price_change_pct, price_gbp, products!inner(name, slug, category)')
      .gte('recorded_at', sevenDaysAgo)
      .match(category === 'all' ? {} : { 'products.category': category })
      .not('price_change_pct', 'is', null)
      .order('price_change_pct', { ascending: false })
      .limit(5)

    for (const row of (historyData ?? []) as Array<{ product_id: string; price_change_pct: number; price_gbp: number; products: { name: string; slug: string } }>) {
      // Fetch lowest active listing price for this product
      const { data: lowestListing } = await supabaseAdmin
        .from('listings')
        .select('price')
        .eq('product_id', row.product_id)
        .eq('in_stock', true)
        .order('price', { ascending: true })
        .limit(1)
        .single()

      await supabaseAdmin.from('market_snapshots').insert({
        category,
        metric: 'top_mover',
        value: {
          product_id: row.product_id,
          slug: row.products.slug,
          name: row.products.name,
          change_pct: Math.round((row.price_change_pct ?? 0) * 10) / 10,
          avg_price: Math.round(row.price_gbp),
          lowest_price: lowestListing?.price ?? null,
        },
        recorded_at: new Date().toISOString(),
      })
    }

    // trending: products appearing on the most distinct sites
    const { data: trendingData } = await supabaseAdmin
      .from('listings')
      .select('product_id, site, price, products!inner(name, slug, category)')
      .eq('in_stock', true)
      .match(category === 'all' ? {} : { 'products.category': category })

    const productSites: Record<string, { name: string; slug: string; sites: Set<string>; minPrice: number }> = {}
    for (const row of (trendingData ?? []) as Array<{ product_id: string; site: string; price: number; products: { name: string; slug: string } }>) {
      if (!productSites[row.product_id]) {
        productSites[row.product_id] = { name: row.products.name, slug: row.products.slug, sites: new Set(), minPrice: Infinity }
      }
      productSites[row.product_id].sites.add(row.site)
      productSites[row.product_id].minPrice = Math.min(productSites[row.product_id].minPrice, row.price)
    }

    const trendingProducts = Object.entries(productSites)
      .sort(([, a], [, b]) => b.sites.size - a.sites.size)
      .slice(0, 6)

    for (const [productId, info] of trendingProducts) {
      await supabaseAdmin.from('market_snapshots').insert({
        category,
        metric: 'trending',
        value: {
          product_id: productId,
          slug: info.slug,
          name: info.name,
          lowest_price: info.minPrice === Infinity ? null : info.minPrice,
          site_count: info.sites.size,
        },
        trending_score: info.sites.size,
        recorded_at: new Date().toISOString(),
      })
    }
  }
}

// Run immediately on start, then every 6 hours
runScrape()
setInterval(runScrape, 6 * 60 * 60 * 1000)
```

- [ ] **Step 2: Create railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx tsx scraper/index.ts",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- [ ] **Step 3: Add scraper env vars to Railway**

In Railway dashboard → your service → Variables, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

- [ ] **Step 4: Test the full orchestrator locally**

```bash
SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key npx tsx scraper/index.ts
```

Expected: each scraper logs its count, Supabase receives data. Verify in Supabase dashboard → Table Editor → `listings`.

- [ ] **Step 5: Commit**

```bash
rm scraper/test-run.ts
git add scraper/index.ts railway.json
git commit -m "feat: add scraper orchestrator with 6h schedule and Railway config"
```

---

## Task 8: API Routes — Products + Listings + Price History

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[slug]/route.ts`
- Create: `app/api/listings/route.ts`
- Create: `app/api/price-history/[productId]/route.ts`
- Create: `app/api/__tests__/products.test.ts`

- [ ] **Step 1: Write failing tests for /api/products**

```ts
// app/api/__tests__/products.test.ts
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'uuid-1',
            name: 'Mercurial Superfly IX',
            brand: 'Nike',
            category: 'boots',
            slug: 'nike-mercurial-superfly-ix',
            lowest_price: 340,
          },
        ],
        error: null,
      }),
    })),
  },
}))

import { GET } from '../products/route'

describe('GET /api/products', () => {
  it('returns 200 with products array', async () => {
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns 200 with category filter applied', async () => {
    const req = new NextRequest('http://localhost/api/products?category=boots')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run app/api/__tests__/products.test.ts
```

Expected: FAIL — `Cannot find module '../products/route'`

- [ ] **Step 3: Create app/api/products/route.ts**

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('products')
    .select(`
      *,
      listings (price, in_stock)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category', category)
  if (brand) query = query.ilike('brand', `%${brand}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute lowest_price from listings join
  const products = (data ?? []).map(p => ({
    ...p,
    lowest_price: p.listings?.length
      ? Math.min(...p.listings.filter((l: { in_stock: boolean }) => l.in_stock).map((l: { price: number }) => l.price))
      : null,
    listings: undefined,
  }))

  return NextResponse.json(products)
}
```

- [ ] **Step 4: Create app/api/products/[slug]/route.ts**

```ts
// app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Best listing per site
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('product_id', product.id)
    .eq('in_stock', true)
    .order('price', { ascending: true })

  // Stats
  const prices = (listings ?? []).map((l: { price: number }) => l.price)
  const stats = {
    lowest_price: prices.length ? Math.min(...prices) : null,
    avg_price: prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : null,
    site_count: new Set((listings ?? []).map((l: { site: string }) => l.site)).size,
  }

  return NextResponse.json({ ...product, listings: listings ?? [], stats })
}
```

- [ ] **Step 5: Create app/api/listings/route.ts**

```ts
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const product_id = searchParams.get('product_id')
  const site = searchParams.get('site')
  const condition = searchParams.get('condition')
  const size_uk = searchParams.get('size_uk')
  const min_price = searchParams.get('min_price')
  const max_price = searchParams.get('max_price')

  let query = supabase
    .from('listings')
    .select('*')
    .eq('in_stock', true)
    .order('price', { ascending: true })

  if (product_id) query = query.eq('product_id', product_id)
  if (site) query = query.eq('site', site)
  if (condition) query = query.eq('condition', condition)
  if (size_uk) query = query.eq('size_uk', size_uk)
  if (min_price) query = query.gte('price', parseFloat(min_price))
  if (max_price) query = query.lte('price', parseFloat(max_price))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 6: Create app/api/price-history/[productId]/route.ts**

```ts
// app/api/price-history/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
  const site = req.nextUrl.searchParams.get('site')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('price_history')
    .select('recorded_at, price_gbp, site')
    .eq('product_id', params.productId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true })

  if (site) query = query.eq('site', site)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 7: Run all API tests**

```bash
npx vitest run app/api/__tests__/
```

Expected: all tests passing.

- [ ] **Step 8: Commit**

```bash
git add app/api/products/ app/api/listings/ app/api/price-history/ app/api/__tests__/
git commit -m "feat: add API routes for products, listings, and price history"
```

---

## Task 9: API Routes — Market

**Files:**
- Create: `app/api/market/route.ts`
- Create: `app/api/market/category/[category]/route.ts`

- [ ] **Step 1: Create app/api/market/route.ts**

```ts
// app/api/market/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Return latest snapshot row for each distinct metric across all categories
  const { data, error } = await supabase
    .from('market_snapshots')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate: keep latest per (category, metric)
  const seen = new Set<string>()
  const latest = (data ?? []).filter(row => {
    const key = `${row.category}:${row.metric}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json(latest)
}
```

- [ ] **Step 2: Create app/api/market/category/[category]/route.ts**

```ts
// app/api/market/category/[category]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const validCategories = ['boots', 'jerseys', 'other', 'all']
  if (!validCategories.includes(params.category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('market_snapshots')
    .select('*')
    .eq('category', params.category)
    .order('recorded_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const seen = new Set<string>()
  const latest = (data ?? []).filter(row => {
    if (seen.has(row.metric)) return false
    seen.add(row.metric)
    return true
  })

  return NextResponse.json(latest)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/market/
git commit -m "feat: add market and market/category API routes"
```

---

## Task 10: Nav, Footer, and Dashboard Page

**Files:**
- Create: `components/ui/Nav.tsx`
- Create: `components/ui/Footer.tsx`
- Create: `components/dashboard/StatsBar.tsx`
- Create: `components/dashboard/TopMoversTable.tsx`
- Create: `components/dashboard/TrendingCards.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create components/ui/Nav.tsx**

```tsx
// components/ui/Nav.tsx
import Link from 'next/link'

export function Nav() {
  return (
    <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-[#ffd700] font-mono font-bold tracking-[3px] text-sm">
        MDFLD MARKET
      </Link>
      <div className="flex gap-6">
        {[
          { href: '/boots', label: 'BOOTS' },
          { href: '/jerseys', label: 'JERSEYS' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-white/40 font-mono text-xs tracking-widest hover:text-white transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create components/ui/Footer.tsx**

```tsx
// components/ui/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-4 text-center">
      <p className="text-white/20 font-mono text-xs tracking-widest">
        MDFLD MARKET · DATA UPDATED EVERY 6 HOURS
      </p>
    </footer>
  )
}
```

- [ ] **Step 3: Update app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/ui/Nav'
import { Footer } from '@/components/ui/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'MDFLD Market — Football Resale Tracker',
  description: 'Track football boot and jersey prices across all major resale platforms.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create components/dashboard/StatsBar.tsx**

```tsx
// components/dashboard/StatsBar.tsx

interface Stat {
  label: string
  value: string
  positive?: boolean
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value, positive }) => (
        <div
          key={label}
          className="bg-white/[0.03] border border-white/[0.08] rounded px-3 py-2"
        >
          <p className="text-white/30 font-mono text-[10px] tracking-widest mb-1">{label}</p>
          <p className={`font-mono font-bold text-sm ${positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-white'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create components/dashboard/TopMoversTable.tsx**

```tsx
// components/dashboard/TopMoversTable.tsx
import Link from 'next/link'

interface TopMover {
  slug: string
  name: string
  lowest_price: number
  avg_price: number
  change_pct: number
}

export function TopMoversTable({ movers }: { movers: TopMover[] }) {
  return (
    <div>
      <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">TOP MOVERS · 7 DAYS</p>
      <div className="border border-white/[0.08] rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-white/[0.04] px-3 py-2 text-[10px] text-white/30 font-mono tracking-widest">
          <span>PRODUCT</span>
          <span>LOW</span>
          <span>AVG</span>
          <span>7D</span>
        </div>
        {movers.map(m => (
          <Link
            key={m.slug}
            href={`/product/${m.slug}`}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2 border-t border-white/[0.05] text-xs font-mono hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-white/85 truncate">{m.name}</span>
            <span className="text-white/45">£{m.lowest_price}</span>
            <span className="text-white/45">£{m.avg_price}</span>
            <span className={m.change_pct >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {m.change_pct >= 0 ? '+' : ''}{m.change_pct}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create components/dashboard/TrendingCards.tsx**

```tsx
// components/dashboard/TrendingCards.tsx
import Link from 'next/link'
import Image from 'next/image'

interface TrendingProduct {
  slug: string
  name: string
  lowest_price: number
  change_pct: number
  site_count: number
  image_url: string | null
}

export function TrendingCards({ products }: { products: TrendingProduct[] }) {
  return (
    <div>
      <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">TRENDING NOW</p>
      <div className="grid grid-cols-3 gap-3">
        {products.map(p => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="bg-white/[0.04] border border-white/[0.09] rounded-md overflow-hidden hover:border-white/20 transition-colors"
          >
            <div className="bg-white/[0.06] h-24 flex items-center justify-center relative">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} fill className="object-cover" />
              ) : (
                <span className="text-white/10 text-[10px] font-mono">NO IMAGE</span>
              )}
            </div>
            <div className="p-2">
              <p className="text-white/75 text-[11px] font-mono leading-tight mb-1 line-clamp-2">{p.name}</p>
              <p className="text-[#ffd700] text-sm font-bold font-mono mb-1">from £{p.lowest_price}</p>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-mono ${p.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {p.change_pct >= 0 ? '+' : ''}{p.change_pct}%
                </span>
                <span className="text-white/25 text-[10px] font-mono">{p.site_count} sites</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create app/page.tsx (Dashboard)**

```tsx
// app/page.tsx
import { StatsBar } from '@/components/dashboard/StatsBar'
import { TopMoversTable } from '@/components/dashboard/TopMoversTable'
import { TrendingCards } from '@/components/dashboard/TrendingCards'

async function getMarketData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/market`, {
    next: { revalidate: 3600 }, // revalidate every hour
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const snapshots = await getMarketData()

  const avgPrice = snapshots?.find((s: { metric: string; category: string }) => s.metric === 'avg_price' && s.category === 'all')
  const volume = snapshots?.find((s: { metric: string; category: string }) => s.metric === 'volume' && s.category === 'all')
  const topMovers = snapshots?.filter((s: { metric: string }) => s.metric === 'top_mover')?.map((s: { value: { name: string; slug: string; avg_price: number; change_pct: number; lowest_price: number | null }}) => ({
    slug: s.value.slug,
    name: s.value.name,
    lowest_price: s.value.lowest_price ?? null,
    avg_price: s.value.avg_price,
    change_pct: s.value.change_pct,
  })) ?? []
  const trending = snapshots?.filter((s: { metric: string }) => s.metric === 'trending')?.map((s: { value: { slug: string; name: string; lowest_price: number; site_count: number }; trending_score: number }) => ({
    slug: s.value.slug,
    name: s.value.name,
    lowest_price: s.value.lowest_price,
    change_pct: 0,
    site_count: s.value.site_count,
    image_url: null,
  })) ?? []

  const stats = [
    { label: 'LISTINGS', value: volume?.value?.count?.toLocaleString() ?? '—' },
    { label: 'AVG PRICE', value: avgPrice ? `£${avgPrice.value.price}` : '—' },
    { label: 'SITES', value: '12' },
    {
      label: '7D CHANGE',
      value: avgPrice?.price_change_7d ? `${avgPrice.price_change_7d > 0 ? '+' : ''}${avgPrice.price_change_7d}%` : '—',
      positive: avgPrice?.price_change_7d > 0,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <StatsBar stats={stats} />
      <TopMoversTable movers={topMovers} />
      <TrendingCards products={trending} />
    </div>
  )
}
```

- [ ] **Step 8: Verify dashboard renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: nav bar, stats bar, top movers table, trending cards section (may be empty if no scrape data yet).

- [ ] **Step 9: Commit**

```bash
git add components/ui/ components/dashboard/ app/page.tsx app/layout.tsx
git commit -m "feat: add Nav, Footer, StatsBar, TopMoversTable, TrendingCards, and dashboard page"
```

---

## Task 11: Browse Pages

**Files:**
- Create: `components/browse/ProductCard.tsx`
- Create: `components/browse/ProductGrid.tsx`
- Create: `components/browse/FilterSidebar.tsx`
- Create: `components/browse/BrowsePage.tsx`
- Create: `app/boots/page.tsx`
- Create: `app/jerseys/page.tsx`

- [ ] **Step 1: Create components/browse/ProductCard.tsx**

```tsx
// components/browse/ProductCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

export function ProductCard({ product }: { product: Product }) {
  const changeColor = product.price_change_7d == null
    ? 'text-white/30'
    : product.price_change_7d >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <Link
      href={`/product/${product.slug}`}
      className="bg-white/[0.04] border border-white/[0.09] rounded-md overflow-hidden hover:border-white/20 transition-colors block"
    >
      <div className="bg-white/[0.06] h-32 flex items-center justify-center relative">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <span className="text-white/10 text-[10px] font-mono">NO IMAGE</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-white/25 font-mono text-[9px] tracking-widest mb-1">{product.brand.toUpperCase()}</p>
        <p className="text-white/85 text-sm font-mono leading-tight mb-2 line-clamp-2">{product.name}</p>
        <div className="flex justify-between items-center">
          <span className="text-[#ffd700] font-bold font-mono text-sm">
            {product.lowest_price ? `£${product.lowest_price}` : '—'}
          </span>
          <span className={`font-mono text-[10px] ${changeColor}`}>
            {product.price_change_7d != null
              ? `${product.price_change_7d >= 0 ? '+' : ''}${product.price_change_7d}%`
              : ''}
          </span>
        </div>
        <p className="text-white/20 font-mono text-[10px] mt-1">
          {product.site_count ?? 0} site{(product.site_count ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create components/browse/ProductGrid.tsx**

```tsx
// components/browse/ProductGrid.tsx
import type { Product } from '@/lib/types'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  page: number
  totalPages: number
  onPage: (page: number) => void
}

export function ProductGrid({ products, page, totalPages, onPage }: ProductGridProps) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={`font-mono text-xs px-3 py-1 border rounded ${
                n === page
                  ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/10'
                  : 'border-white/15 text-white/40 hover:border-white/30'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create components/browse/FilterSidebar.tsx**

```tsx
// components/browse/FilterSidebar.tsx
'use client'
import { useState } from 'react'

interface Filters {
  brand: string
  size_uk: string
  condition: string
  min_price: string
  max_price: string
}

interface FilterSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const UK_SIZES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <aside className="w-48 shrink-0 space-y-6">
      <div>
        <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">BRAND</p>
        <input
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded px-2 py-1 text-white/70 font-mono text-xs focus:outline-none focus:border-white/30"
          placeholder="e.g. Nike"
          value={filters.brand}
          onChange={e => set('brand')(e.target.value)}
        />
      </div>

      <div>
        <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">SIZE (UK)</p>
        <div className="flex flex-wrap gap-1">
          {UK_SIZES.map(s => (
            <button
              key={s}
              onClick={() => set('size_uk')(filters.size_uk === s ? '' : s)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                filters.size_uk === s
                  ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/10'
                  : 'border-white/10 text-white/35 hover:border-white/25'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">CONDITION</p>
        {['', 'new', 'used'].map(c => (
          <button
            key={c}
            onClick={() => set('condition')(c)}
            className={`block w-full text-left font-mono text-xs px-2 py-1 rounded transition-colors ${
              filters.condition === c ? 'text-[#ffd700]' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {c === '' ? 'ALL' : c.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">PRICE RANGE (£)</p>
        <div className="flex gap-2">
          <input
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded px-2 py-1 text-white/70 font-mono text-xs focus:outline-none"
            placeholder="Min"
            value={filters.min_price}
            onChange={e => set('min_price')(e.target.value)}
          />
          <input
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded px-2 py-1 text-white/70 font-mono text-xs focus:outline-none"
            placeholder="Max"
            value={filters.max_price}
            onChange={e => set('max_price')(e.target.value)}
          />
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Create components/browse/BrowsePage.tsx**

```tsx
// components/browse/BrowsePage.tsx
'use client'
import { useState, useEffect } from 'react'
import { FilterSidebar } from './FilterSidebar'
import { ProductGrid } from './ProductGrid'
import type { Product } from '@/lib/types'

const PAGE_SIZE = 24

export function BrowsePage({ category }: { category: 'boots' | 'jerseys' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    brand: '',
    size_uk: '',
    condition: '',
    min_price: '',
    max_price: '',
  })

  useEffect(() => {
    const params = new URLSearchParams({ category, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) })
    if (filters.brand) params.set('brand', filters.brand)

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setTotal(data.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + data.length : page * PAGE_SIZE + 1)
      })
  }, [category, page, filters])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-white/80 font-mono font-bold tracking-widest text-sm mb-6">
        {category.toUpperCase()}
      </h1>
      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={f => { setFilters(f); setPage(1) }} />
        <div className="flex-1">
          <ProductGrid
            products={products}
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create app/boots/page.tsx and app/jerseys/page.tsx**

```tsx
// app/boots/page.tsx
import { BrowsePage } from '@/components/browse/BrowsePage'
export default function BootsPage() { return <BrowsePage category="boots" /> }
```

```tsx
// app/jerseys/page.tsx
import { BrowsePage } from '@/components/browse/BrowsePage'
export default function JerseysPage() { return <BrowsePage category="jerseys" /> }
```

- [ ] **Step 6: Verify browse pages render**

```bash
npm run dev
```

Open `http://localhost:3000/boots`. Expected: sidebar with filters, empty product grid (or real data if scraper has run).

- [ ] **Step 7: Commit**

```bash
git add components/browse/ app/boots/ app/jerseys/
git commit -m "feat: add browse pages with shared BrowsePage component, filters, and product grid"
```

---

## Task 12: Product Detail Page

**Files:**
- Create: `components/product/HeroPrice.tsx`
- Create: `components/product/PriceHistoryChart.tsx`
- Create: `components/product/SizeSelector.tsx`
- Create: `components/product/ListingsTable.tsx`
- Create: `app/product/[slug]/page.tsx`

- [ ] **Step 1: Create components/product/HeroPrice.tsx**

```tsx
// components/product/HeroPrice.tsx
import type { Product } from '@/lib/types'

export function HeroPrice({ product, stats }: {
  product: Product
  stats: { lowest_price: number | null; avg_price: number | null; site_count: number }
}) {
  return (
    <div className="border-b border-white/[0.08] pb-6 mb-6">
      <p className="text-white/25 font-mono text-[10px] tracking-widest mb-1">
        {product.brand.toUpperCase()} · {product.category.toUpperCase()}
      </p>
      <h1 className="text-white font-mono font-bold text-2xl mb-4">{product.name}</h1>
      <div className="flex items-end gap-6">
        <div>
          <p className="text-white/25 font-mono text-[9px] tracking-widest mb-0.5">LOWEST NOW</p>
          <p className="text-[#ffd700] font-mono font-black text-4xl leading-none">
            {stats.lowest_price ? `£${stats.lowest_price}` : '—'}
          </p>
        </div>
        {[
          { label: 'AVG', value: stats.avg_price ? `£${stats.avg_price}` : '—' },
          { label: 'RETAIL', value: product.retail_price ? `£${product.retail_price}` : '—' },
          { label: 'SITES', value: String(stats.site_count) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-white/25 font-mono text-[9px] tracking-widest mb-0.5">{label}</p>
            <p className="text-white/70 font-mono font-bold text-xl">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/product/PriceHistoryChart.tsx**

```tsx
// components/product/PriceHistoryChart.tsx
'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PriceHistoryPoint } from '@/lib/types'

const SITE_COLORS: Record<string, string> = {
  rareboots: '#ffd700',
  klekt: '#4FC3F7',
  ebay: '#ffffff',
  bootroom: '#a78bfa',
  bootchamber: '#34d399',
}

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: 365 },
]

export function PriceHistoryChart({ productId }: { productId: string }) {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<PriceHistoryPoint[]>([])

  // Fetch on mount and whenever period or productId changes
  useEffect(() => {
    fetch(`/api/price-history/${productId}?days=${period}`)
      .then(r => r.json())
      .then(setData)
  }, [period, productId])

  const sites = [...new Set(data.map(d => d.site))]

  // Group by date for chart
  const grouped = data.reduce((acc, point) => {
    const date = point.recorded_at.slice(0, 10)
    if (!acc[date]) acc[date] = { date }
    acc[date][point.site] = point.price_gbp
    return acc
  }, {} as Record<string, Record<string, string | number>>)

  const chartData = Object.values(grouped).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-white/30 font-mono text-[10px] tracking-widest">PRICE HISTORY (GBP)</p>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.days)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                period === p.days
                  ? 'border-[#ffd700] text-[#ffd700]'
                  : 'border-white/15 text-white/30 hover:border-white/30'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.07] rounded p-3" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: 11 }}
              formatter={(value: number) => [`£${value}`, '']}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 10 }} />
            {sites.map(site => (
              <Line
                key={site}
                type="monotone"
                dataKey={site}
                stroke={SITE_COLORS[site] ?? 'rgba(255,255,255,0.4)'}
                strokeWidth={site === 'rareboots' ? 2 : 1.2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create components/product/SizeSelector.tsx**

```tsx
// components/product/SizeSelector.tsx
'use client'

interface SizeSelectorProps {
  sizes: string[]
  selected: string | null
  onSelect: (size: string | null) => void
}

export function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  if (!sizes.length) return null

  return (
    <div>
      <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">SIZE (UK)</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`font-mono text-xs px-3 py-1 rounded border transition-colors ${
            selected === null
              ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/10'
              : 'border-white/15 text-white/35 hover:border-white/30'
          }`}
        >
          ALL
        </button>
        {sizes.map(s => (
          <button
            key={s}
            onClick={() => onSelect(selected === s ? null : s)}
            className={`font-mono text-xs px-3 py-1 rounded border transition-colors ${
              selected === s
                ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/10'
                : 'border-white/15 text-white/35 hover:border-white/30'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create components/product/ListingsTable.tsx**

```tsx
// components/product/ListingsTable.tsx
import type { Listing } from '@/lib/types'

export function ListingsTable({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return <p className="text-white/25 font-mono text-xs">No listings found.</p>
  }

  const lowestPrice = Math.min(...listings.map(l => l.price))

  return (
    <div>
      <p className="text-white/30 font-mono text-[10px] tracking-widest mb-2">
        ALL LISTINGS · SORTED BY PRICE
      </p>
      <div className="border border-white/[0.08] rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 bg-white/[0.04] px-3 py-2 text-[10px] text-white/30 font-mono tracking-widest">
          <span>SITE</span>
          <span>CONDITION</span>
          <span>SHIP</span>
          <span>PRICE</span>
          <span></span>
        </div>
        {listings.map(l => {
          const isBest = l.price === lowestPrice
          return (
            <div
              key={l.id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 border-t border-white/[0.05] text-xs font-mono items-center ${
                isBest ? 'bg-[#ffd700]/[0.04] border-l-2 border-l-[#ffd700]/50' : ''
              }`}
            >
              <span className={isBest ? 'text-[#ffd700] tracking-widest text-[10px]' : 'text-white/50 tracking-widest text-[10px]'}>
                {l.site.toUpperCase()}
              </span>
              <span className="text-white/50">{l.condition ?? '—'}{l.condition_notes ? ` · ${l.condition_notes}` : ''}</span>
              <span className="text-white/30">{l.shipping_cost ? `£${l.shipping_cost}` : '—'}</span>
              <span className={isBest ? 'text-[#ffd700] font-bold' : 'text-white/80 font-bold'}>£{l.price}</span>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/25 hover:text-white/70 transition-colors text-[10px] underline"
              >
                VIEW →
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create app/product/[slug]/page.tsx**

```tsx
// app/product/[slug]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { HeroPrice } from '@/components/product/HeroPrice'
import { PriceHistoryChart } from '@/components/product/PriceHistoryChart'
import { SizeSelector } from '@/components/product/SizeSelector'
import { ListingsTable } from '@/components/product/ListingsTable'
import type { Product, Listing } from '@/lib/types'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState({ lowest_price: null as number | null, avg_price: null as number | null, site_count: 0 })
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(r => r.json())
      .then(data => {
        setProduct(data)
        setListings(data.listings ?? [])
        setStats(data.stats ?? { lowest_price: null, avg_price: null, site_count: 0 })
      })
  }, [slug])

  const sizes = [...new Set(listings.map((l: Listing) => l.size_uk).filter(Boolean) as string[])].sort()
  const filtered = selectedSize ? listings.filter(l => l.size_uk === selectedSize) : listings

  if (!product) {
    return <div className="text-white/30 font-mono text-sm p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <p className="text-white/20 font-mono text-[10px] tracking-widest">
        MARKET / {product.category.toUpperCase()} / {product.name.toUpperCase()}
      </p>
      <HeroPrice product={product} stats={stats} />
      <PriceHistoryChart productId={product.id} />
      <SizeSelector sizes={sizes} selected={selectedSize} onSelect={setSelectedSize} />
      <ListingsTable listings={filtered} />
    </div>
  )
}
```

- [ ] **Step 6: Verify product page renders**

```bash
npm run dev
```

If scraper has run, navigate to any product via dashboard. Otherwise test with a known slug from Supabase. Expected: breadcrumb, hero price block, chart area, size pills, listings table.

- [ ] **Step 7: Commit**

```bash
git add components/product/ app/product/
git commit -m "feat: add product detail page with hero price, chart, size selector, and listings table"
```

---

## Task 13: Final Polish + Deployment

**Files:**
- Modify: `next.config.js` (image domains)
- Create: `vercel.json`

- [ ] **Step 1: Update next.config.js for image domains**

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.rareboots.com' },
      { protocol: 'https', hostname: '**.klekt.com' },
      { protocol: 'https', hostname: '**.ebayimg.com' },
      { protocol: 'https', hostname: '**.vinted.co.uk' },
      { protocol: 'https', hostname: '**.classicfootballshirts.co.uk' },
    ],
  },
}
module.exports = nextConfig
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests passing, zero failures.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 4: Add NEXT_PUBLIC_APP_URL to Vercel environment**

In Vercel dashboard → your project → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

Expected: deployment URL returned. Open it and verify all four pages load.

- [ ] **Step 6: Deploy scraper to Railway**

```bash
# Push to GitHub first
git remote add origin https://github.com/mdfld/mdfld-market-tracker
git push -u origin main

# In Railway dashboard:
# New Project → Deploy from GitHub repo → mdfld-market-tracker
# Add environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY
# Railway will auto-detect railway.json and start the scraper
```

- [ ] **Step 7: Verify first scrape run**

In Railway logs, confirm:
```
[timestamp] Starting full scrape
  Scraping: rareboots
  rareboots: X listings
  ...
[timestamp] Scrape complete
```

In Supabase → Table Editor → `listings`: rows should be appearing.

- [ ] **Step 8: Final commit**

```bash
git add next.config.js
git commit -m "feat: complete MDFLD market tracker — scraper, API, dashboard, browse, product pages"
```

---

## Running the Project

```bash
cd /Users/ayoola/Desktop/mdfld-market-tracker

npm run dev          # development → http://localhost:3000
npm run build        # production build
npm run test         # run test suite
npx tsx scraper/index.ts  # run scraper manually (needs env vars)
```

---

## Spec Verification Checklist

- [ ] Dashboard loads with stats bar, top movers, trending cards
- [ ] /boots and /jerseys pages render with filter sidebar
- [ ] Product page shows hero price, chart, size selector, listings table
- [ ] Lowest price listing has gold left border in listings table
- [ ] Price history chart renders with one line per site
- [ ] Adding a new scraper requires only one new file in scraper/sites/
- [ ] All `/api/*` routes return valid JSON
- [ ] `npm run test` passes with zero failures
- [ ] `npm run build` exits with code 0
