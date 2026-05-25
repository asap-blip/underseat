# flypewpet

**Will this specific pet carrier work for this specific flight itinerary?**

flypewpet is a focused compatibility checker — not a general pet-travel planner.
You give it a carrier and an itinerary; it returns **PASS / BORDERLINE / NO**,
leg by leg, with transparent structured reasons. It is explicitly a
*compatibility checker, not a guarantee engine* — the airline always makes the
final acceptance decision at the gate.

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres/auth/storage) — optional; see "Data layer" below
- **Zod** for validation, **React Hook Form** for the trip builder
- **Vitest** for unit tests, **Playwright** for browser smoke tests
- Vercel-ready (standard Next App Router output, no custom server)

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs fully **without any configuration** — it defaults to a bundled
static seed data layer, so every page and the API work out of the box.

```bash
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests (engine + service)
npm run build        # production build
npm run test:e2e     # Playwright smoke tests (needs browsers installed)
```

## Data layer (static seed vs. Supabase)

There is a single `Repository` interface (`src/lib/data/repository.ts`) with two
implementations, selected automatically at runtime:

| Condition | Implementation |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | `SupabaseRepository` |
| otherwise (default) | `StaticRepository` (bundled seed) |

**Canonical seed:** `src/lib/data/seed.ts` is the single source of truth (used by
the static layer and the tests). Running `npm run seed:sql` regenerates
`supabase/seed.sql` from it, so the database seed never drifts.

### Using Supabase

```bash
cp .env.example .env.local      # fill in your Supabase keys
# In the Supabase SQL editor (or supabase CLI), run in order:
#   supabase/migrations/0001_init.sql
#   supabase/seed.sql            (regenerate first with: npm run seed:sql)
```

Writes (`compatibility_checks`, `outbound_clicks`) use the service-role key from
API routes. Catalog/reference tables are world-readable via RLS; tighten before
production.

## Environment variables

See `.env.example`. All are optional — the app degrades to the static layer and
to untagged outbound links when they are absent.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Switch the data layer to Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes for checks/clicks |
| `NEXT_PUBLIC_AFFILIATE_TAG` | Appended to outbound affiliate links |
| `NEXT_PUBLIC_SITE_URL` | Base URL for absolute links |

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing — one-line value prop + CTA |
| `/carriers` | Searchable carrier catalog + QR/code lookup |
| `/check` | Trip builder (carrier + pet + 1..n flight legs) |
| `/result?d=<token>` | Shareable result — recomputed from the itinerary encoded in the link |
| `/merchant/[slug]` | Merchant demo with the embeddable `CheckWidget` |
| `/admin` | Dev data view (carriers, airline rules, merchants, data source) |

## API

| Endpoint | Description |
| --- | --- |
| `POST /api/check` | Core contract: `CheckInput → CheckResponse` (+ `shareToken`). Used by the result page and the future embed widget. |
| `GET /api/resolve?code=` | Resolve a QR/SKU/product code to a carrier |
| `GET /api/click?carrier=&network=&check=` | Records an outbound affiliate click, then 302-redirects to the destination |

`CheckResponse` (see `src/lib/check/service.ts`) is the stable, API-ready
result contract:

```jsonc
{
  "input":   { /* CheckInput */ },
  "carrier": { /* Carrier */ },
  "result":  { "overall": "PASS|BORDERLINE|NO", "confidence": "...", "legs": [ /* per-leg */ ] },
  "alternatives": [ { "carrier": {...}, "verdict": "PASS", "spareCm": 12.3, "reasons": ["..."] } ],
  "meta":    { "dataSource": "static-seed|supabase", "generatedAt": "..." },
  "shareToken": "base64url"
}
```

## Rules engine

`src/lib/rules/engine.ts` is **pure, deterministic, and fully unit-tested**. It:

- compares carrier vs. airline max dimensions using an **orientation-independent
  sorted comparison** (the carrier's longest side vs. the rule's longest allowance);
- gives soft-sided carriers a small compression margin (overage within it →
  `BORDERLINE` instead of `NO`); hard-sided get none;
- checks combined pet + carrier weight;
- enforces soft-sided **required** (fail) vs. **recommended** (warn);
- flags incomplete rule data and aircraft/cabin imprecision;
- assesses pet comfort from optional measurements (or notes uncertainty);
- always appends the airline-discretion caveat.

**Verdict rule:** any `fail` reason → `NO`; else any `warn` → `BORDERLINE`; else
`PASS`. **Trip rule:** any leg `NO` → trip `NO`; else any `BORDERLINE` → trip
`BORDERLINE`; else `PASS`.

Reason codes are structured (e.g. `DIMENSION_HEIGHT_EXCEEDED`,
`SOFT_SIDED_REQUIRED`, `AIRCRAFT_DATA_MISSING`, `PET_COMFORT_UNCERTAIN`,
`FINAL_APPROVAL_AIRLINE_DISCRETION`) — see `src/lib/rules/reasonCodes.ts`.

## Monetization

**Affiliate (day 1).** When a result is `NO`/`BORDERLINE`, the result page shows
better-fit alternatives **ranked by fit against the actual itinerary, not by
payout**. On `PASS` it shows at most two roomier options without distracting from
the result. Outbound links go through `/api/click` for server-side tracking, and
affiliate URLs are per-carrier and per-network (`affiliate_targets`) so they can
be swapped by an admin/network later.

**MRR foundation (built, not over-built).** `merchants` + `merchant_products`
tables, a reusable `CheckWidget` that talks only to `/api/check`, and the
`/merchant/[slug]` demo showing how a retailer would embed the checker. No
billing in v1, but the schema and the result contract are shaped so merchant
accounts/subscriptions slot in cleanly later.

## Data model

Schema in `supabase/migrations/0001_init.sql`: `users`, `pets`, `carriers`,
`airlines`, `airline_rules`, `trips`, `trip_legs`, `compatibility_checks`,
`merchants`, `merchant_products`, `affiliate_targets`, `outbound_clicks`,
`product_codes`. Dimensions are centimetres, weights kilograms.

## Seed data

8 airlines, 9 cabin rules (incl. a Lufthansa business variant and a
deliberately-incomplete Delta rule to exercise the missing-data path), 22
carriers (mixed soft/hard, mixed verification), product codes, 2 merchants.

> ⚠️ **Airline rule values are illustrative.** They reflect publicly documented
> patterns at seeding time and are stamped with `source_url` + `last_verified_at`
> so staleness is visible in the UI and `/admin`. **Re-verify against each
> airline's live policy before relying on them.** Sources include
> [Air Canada](https://www.aircanada.com/ca/en/aco/home/plan/special-assistance/pets.html)
> and the other carriers' published pet pages.

## Notes & assumptions

- **No Supabase credentials were available in the build environment**, so the
  static seed layer is the default and is what the tests and the live smoke
  checks exercise. The Supabase repository + SQL schema/seed are provided and
  wired, ready to activate by setting env vars.
- **Shareable results** are stateless: the itinerary is base64url-encoded into
  the `/result` link and recomputed, so sharing works with or without a database.
  When Supabase is configured, each check is also persisted to
  `compatibility_checks`.
- Playwright browser binaries could not be downloaded in the sandbox (network
  policy), so the e2e suite is written but was validated indirectly via direct
  HTTP/API checks against the production server. Run `npx playwright install`
  then `npm run test:e2e` locally/in CI.

## Non-goals

No hotel finder, no broad travel planner, no chatbot, no relocation/document
flows, no booking engine, no payments in v1. The app stays narrow on purpose.
