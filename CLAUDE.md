# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Citadel

Self-hosted LEGO collection tracker that treats a collection as an investment portfolio. Tracks sets (new-sealed vs used), pulls daily market prices from external APIs, and shows P&L per item and portfolio-wide. Deployed on homelab "Scarif" behind Traefik + Authentik SSO.

## Commands

```bash
pnpm dev              # dev server (localhost:3000)
pnpm build            # Nuxt build → .output/
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # vue-tsc

pnpm db:generate      # generate Drizzle migration from schema changes
pnpm db:migrate       # apply pending migrations
pnpm db:studio        # Drizzle Studio UI

pnpm worker           # run refresh-prices worker manually (needs DB + API keys)

# Build the standalone worker and migrate bundles
node scripts/bundle-worker.mjs   # → .output/worker.mjs + .output/migrate.mjs
```

## Architecture

```
app/          ← Nuxt 4 SPA (ssr: false, compatibilityVersion: 4)
  pages/      ← dashboard.vue, index.vue, aide.vue
  components/ ← LibraryTable, AddSetModal, EditItemModal, PriceListingsPanel, KpiCard
  stores/     ← Pinia stores (items, dashboard, user)
  composables/← useExport (Excel download)

server/       ← Nitro BFF (all API routes + worker)
  api/        ← Nitro event handlers (items.get.ts, items.post.ts, me.get.ts, health.get.ts)
  middleware/ ← auth.ts: reads X-authentik-* headers, JIT-creates users row
  db/         ← index.ts (Drizzle client), schema.ts (all tables + enums)
  lib/        ← one file per external API (bricklink, brickowl, rebrickable, ebay, avenuedelabrique, fx, excel)
  tasks/      ← refresh-prices.ts (worker entrypoint), migrate.ts
  utils/      ← pricing.ts (latestPriceFor + price-source priority), catalog.ts, auth.ts, env.ts

drizzle/      ← SQL migration files (generated, do not edit manually)
scripts/      ← bundle-worker.mjs (esbuild bundles for Docker image)
```

## Key Architectural Decisions

**Auth**: No login screen. Traefik injects `X-authentik-uid/email/username/groups` after Authentik SSO. The Nitro middleware (`server/middleware/auth.ts`) reads these headers and JIT-creates a `users` row on first request. Admin role comes from `X-authentik-groups` matching `ADMIN_GROUP` — never stored in DB. In dev, set `DEV_AUTHENTIK_UID` in `.env` to bypass auth.

**Two processes, one image**: The Docker image runs either as the Nuxt/Nitro app or as the pricing worker (`node .output/worker.mjs`). The worker is a standalone node-cron process — not a Nitro scheduled task — so it can run on a separate container with its own IP for BrickLink's whitelist.

**Pricing pipeline** (`server/tasks/refresh-prices.ts`): Runs daily at 04:00 (Paris). For each distinct `set_no` in `user_items`, fetches prices from all sources in parallel, calls `consolidate()` (→ `price_snapshots`), `consolidateListings()` (→ `price_listings`), then recomputes `portfolio_snapshots` via a single lateral-join SQL.

**Price source priority** (`server/utils/pricing.ts → latestPriceFor`):

- `new_sealed`: avenuedelabrique listing → bricklink sold → brickowl
- `used`: bricklink sold → brickowl (brickowl is always `degraded: true`)

**Set number normalization**: Always stored as `75281-1` (with `-1` suffix). `normalizeSetNo()` in `server/utils/pricing.ts` adds it if missing. Apply this before any DB lookup.

**Data model**: `catalog_sets` is a shared global cache (all users); `user_items` is per-user. `price_snapshots` is one row per set/condition/source/day. `portfolio_snapshots` is the pre-aggregated daily value per user (what the dashboard reads — never recomputed on page load).

## External APIs

| Service          | Auth                | Purpose                                                  |
| ---------------- | ------------------- | -------------------------------------------------------- |
| BrickLink        | OAuth 1.0a (4 keys) | Primary price guide (sold/stock), individual listings    |
| BrickOwl         | API key             | Fallback used-price (cheapest in GBP → converted to EUR) |
| Rebrickable      | API key             | Catalog enrichment (name, theme, year, parts, image)     |
| eBay Finding     | App ID              | Secondary sold prices (France)                           |
| avenuedelabrique | Playwright scraping | New-sealed retail price (cheapest listing)               |
| ECB/FX           | public              | GBP→EUR rate for BrickOwl conversion                     |

BrickLink has a 5000 req/day quota; the worker uses ~2 req/set/day. BrickLink tokens are IP-whitelisted to Scarif's public IP.

## Environment Variables

See `.env.example`. Required for worker: `DATABASE_URL`, `BRICKLINK_*` (4 keys), `REBRICKABLE_API_KEY`. Optional: `BRICKOWL_API_KEY`, `EBAY_APP_ID`, `CRON_SCHEDULE`. Dev only: `DEV_AUTHENTIK_UID` (bypasses Authentik header requirement).

## Deployment

Docker Compose (`docker-compose.yml`) with three services: `citadel-db` (Postgres, internal network only), `citadel-app` (Nitro, no exposed ports — only via Traefik), `citadel-worker` (same image, `command: node .output/worker.mjs`). App is only reachable through Traefik, which is what makes the `X-authentik-*` headers trustworthy.
