# Flypp — Build State

> Engineering handoff / implementation status. Paste into chat to resume.
> Repo: `asap-blip/flypewpet` (brand referred to as **Flypp / FlyPetAffi**).
> Last updated from session work on branch `claude/upbeat-lovelace-O7v2M`.

## 1. Project overview
- **What it does:** itinerary-based pet-carrier compatibility checker. User picks/looks-up a carrier, enters pet + flight legs, gets `PASS / BORDERLINE / NO` per leg with reasons, sources, and confidence. Also a reverse "find a carrier" flow and a curated catalog with evidence-based trust badges.
- **Follow-up loop mode:** **collect-only** right now. The app captures trip follow-up opt-ins into Supabase; **no emails are sent** (n8n workflows are inactive).
- **Core stack:** Next.js (App Router, TS, Tailwind) · Supabase (Postgres + PostgREST) · n8n (cron workflows) · Resend (email provider, via HTTP) · Obsidian (this note).
- **Data layer:** repository abstraction; defaults to a bundled static seed, switches to Supabase when env vars are set.

## 2. Current branch / recent work
- **Branch:** `claude/upbeat-lovelace-O7v2M`
- **Recent work:** evidence-based badge refactor → traveler-followup schema → n8n follow-up + reminder workflows → status-lifecycle reconciliation → traveler response completion page.

## 3. Completed work
- **Badge system refactor** — replaced stacked `verified/community/unverified` chips with a single primary status badge + secondary evidence line + info popover. Statuses: `team_verified`, `traveler_reported`, `not_verified_yet` (+ `failed_check`, `needs_review` wired for future). Single source of truth in `src/lib/carrierStatus.ts`; UI in `src/components/CarrierStatus.tsx`.
- **Verification legend / explainer** — collapsed "How verification works" panel above the catalog grid (`src/components/VerificationLegend.tsx`).
- **Trip follow-up capture flow** — `src/components/TripFollowupForm.tsx` + server action `src/app/actions/trip-followup.ts`; rendered on the results page. Inserts a `trip_followups` row, computes `followup_send_at` = departure + 18h and `reminder_send_at` = +3 days, captures UTM params. Degrades gracefully (logs, no persist) when Supabase isn't configured.
- **Supabase migrations created** — `0005`, `0006`, `0007` (see §4).
- **n8n workflows created** — "FlyPetAffi — Trip Follow-up" and "FlyPetAffi — Follow-up Reminder" (see §5). Both **inactive**.
- **Traveler response completion flow** — `/respond?f=<id>&o=<outcome>` page + `submitTravelerResponse` action + `TravelerResponseForm`. Records a `traveler_reports` row and flips the follow-up to `completed`.
- **Status lifecycle** — canonical `pending → sent → reminded → completed / cancelled`, enforced by DB CHECK (see §8).
- **Moderation-ready traveler report flow** — reports insert with `moderation_status='needs_review'` and `evidence_level='self_reported'` (DB defaults). Nothing auto-promotes them yet.

## 4. Database / schema status
Relevant tables (defined in migration `0006`):

```
carrier_airline_verifications   -- per (carrier_id, airline_id) trust state + evidence
  id, carrier_id FK, airline_id FK, airline_rule_id FK (nullable),
  status (enum carrier_verification_status), verification_method,
  explanation, last_checked_at,
  traveler_report_count, traveler_positive_count, traveler_negative_count,
  confidence_score numeric(4,3) [0..1],
  created_at, updated_at (trigger)
  UNIQUE (carrier_id, airline_id); RLS: public read

trip_followups                  -- opt-in capture for follow-up emails (PII)
  id, email, airline_id FK, carrier_id FK,
  departure_date, return_date, route_text,
  utm_source, utm_medium, utm_campaign,
  consent_followup, followup_status, followup_send_at, reminder_send_at, created_at
  RLS: locked (service role only); partial index on (followup_status, followup_send_at) where consent_followup

traveler_reports                -- moderated crowdsourced "did it work" reports (PII)
  id, trip_followup_id FK, email, airline_id FK, carrier_id FK, travel_date,
  outcome (accepted|denied|unsure), stage (check_in|gate|boarding|onboard),
  notes, photo_url,
  evidence_level (self_reported|photo|boarding_pass|verified_document) default self_reported,
  moderation_status (needs_review|approved|rejected|spam) default needs_review,
  created_at, reviewed_at
  RLS: locked (service role only)
```

Migrations:
- **`0005_carrier_status.sql`** — remapped `carriers.verification` values (`verified→team_verified`, `community→traveler_reported`, `unverified→not_verified_yet`), tightened CHECK to the 5 new values, added `carriers.traveler_reports`.
- **`0006_traveler_followup_verifications.sql`** — created `carrier_airline_verifications`, `trip_followups`, `traveler_reports`; added `carrier_verification_status` enum, an `airline_pet_rules` view alias over existing `airline_rules`, an `updated_at` trigger, FKs, CHECKs, indexes, RLS.
- **`0007_followup_status_lifecycle.sql`** — tightened `trip_followups.followup_status` CHECK to `pending/sent/reminded/completed/cancelled` (dropped unused `scheduled`; folds any legacy `scheduled` rows → `pending`). Added as a new migration; `0006` left immutable.

> Note: `airlines`, `carriers`, `airline_rules` already existed from `0001`. `0006` reuses them; `airline_pet_rules` is a view alias only.

## 5. Email workflow status
**On follow-up form submit (`/result` page):**
- Server action validates, computes send times, inserts a `trip_followups` row with `followup_status='pending'`, `followup_send_at = departure + 18h`, `reminder_send_at = followup_send_at + 3 days`.
- **Stored in Supabase** (`trip_followups`), **not** in Resend. If Supabase env isn't configured, the opt-in is accepted and logged but not persisted (collect-only dev behavior).

**Where emails get sent (when active):** n8n, hourly cron.
- **First email** — workflow "FlyPetAffi — Trip Follow-up" (`AOPKSepdms3wR0xb`): query `consent_followup=true AND followup_status='pending' AND followup_send_at <= now()` → send via Resend → update row to `sent`. So it goes out ~18h after departure.
- **Reminder** — workflow "FlyPetAffi — Follow-up Reminder" (`Uwj2qMNufu7wCe1U`): query `consent_followup=true AND followup_status='sent' AND reminder_send_at <= now()` → send → update to `reminded`. So ~3 days after the first email, only for non-responders.

**Current truths:**
- Both workflows are **inactive** (`active:false`, not published). **No emails go out.**
- App is in **collect-only** mode by design.
- **Resend logs nothing** until the workflows are active and actually call its API.
- n8n base URL: `https://sublobster.duckdns.org` · Supabase cred auto-assigned ("Willwin Supabase") · Resend HTTP Bearer cred must be set manually.

## 6. Manual setup still required
- [ ] Apply migrations `0005`, `0006`, `0007` on the live Supabase project.
- [ ] Verify Supabase credentials / project alignment (n8n "Willwin Supabase" → the project holding these tables; tables exposed to PostgREST).
- [ ] Add Resend API key to the HTTP nodes in both workflows (HTTP Bearer Auth, e.g. "Resend API Key").
- [ ] Verify sending domain / `from` address in Resend (currently placeholder `followups@flypetaffi.com`).
- [ ] Activate both workflows when ready.
- [ ] Update workflow email HTML to use `/respond?f={{ $json.id }}&o=worked|did_not_work|mixed` buttons (still says "reply to this email").

## 7. Remaining product work
**Critical next steps**
- [ ] Moderation/admin review flow for `traveler_reports` (`needs_review → approved/rejected/spam`).
- [ ] Aggregation: roll approved `traveler_reports` into `carrier_airline_verifications` (counts + status).
- [ ] Traveler report counts / `confidence_score` logic feeding the badge.
- [ ] Wire `/respond` CTA links into the n8n email HTML.

**Later improvements**
- [ ] Admin export / view tooling for follow-ups + reports.
- [ ] Per-(carrier, airline) badge wiring (UI currently reads catalog-level `carriers.verification`, not `carrier_airline_verifications`).
- [ ] Analytics dashboard (opt-ins, response rate, outcomes).
- [ ] Inbound "reply = completed" handling if keeping reply-based emails.

## 8. Canonical status logic
**`trip_followups.followup_status`:**
```
pending → sent → reminded → completed
                 \→ cancelled (opt-out)
```
- `pending`  : inserted by the app on opt-in
- `sent`     : first email sent (workflow 1)
- `reminded` : reminder sent (workflow 2)
- `completed`: traveler responded (response flow) — drops out of reminder query
- `cancelled`: opted out (no current writer)

**Traveler response UI → `traveler_reports.outcome`:**
```
worked        → accepted
did_not_work  → denied
mixed         → unsure
```

**Carrier badge statuses:** `team_verified`, `traveler_reported`, `not_verified_yet`, `failed_check`, `needs_review` (config in `src/lib/carrierStatus.ts`).

## 9. Current known truths / caveats
- Collect-only mode is **intentional** right now.
- Follow-up opt-ins are stored in **Supabase**, never in Resend.
- Workflows are **inactive** → **no emails are sent**.
- The `/respond` response page **exists** and works (records report + sets `completed`).
- Reminder exclusion works **once `completed` is set** (reminder queries `status='sent'`).
- Badge trust UX is improved, but **traveler aggregation into `carrier_airline_verifications` is not yet automated** — reports sit at `needs_review`.
- The live results-page badge still reflects catalog-level `carriers.verification`, not the per-(carrier,airline) table.
- Verification of airline rules was via current public sources (airline pages were bot-blocked); values dated `2026-05-26`.

## 10. Resume prompts (copy-paste)
- `Build the moderation flow for traveler_reports: an admin route to review needs_review reports and set approved/rejected/spam, writing reviewed_at. Reuse existing Supabase helpers and the ADMIN_TOKEN guard.`
- `Wire traveler_reports aggregation into carrier_airline_verifications: on approved reports, recompute traveler_report_count / positive / negative and set status + confidence_score for that (carrier, airline). Keep the status lifecycle and badge config unchanged.`
- `Activate the email CTA links in the n8n workflows: update the Resend email HTML in both FlyPetAffi workflows to include worked / did_not_work / mixed buttons linking to /respond?f={{ $json.id }}&o=... using a SITE_URL env.`
- `Build admin exports/dashboard: read-only views of trip_followups and traveler_reports with counts (opt-ins, sent, reminded, completed, outcomes). Service-role reads only.`

## 11. Quick resume summary (where we are now)
- Compatibility checker + curated catalog + reverse search are live; badge system is evidence-based.
- Follow-up loop is **built but collect-only**: opt-ins persist to `trip_followups` (`pending`).
- Two n8n cron workflows exist (first email + reminder) but are **inactive**.
- `/respond` completion page records `traveler_reports` and sets `followup_status='completed'`.
- Status lifecycle is canonical and DB-enforced: `pending→sent→reminded→completed/cancelled`.
- Migrations `0005/0006/0007` written; **not yet confirmed applied** to live Supabase.
- Outstanding before emails flow: apply migrations, set Resend key + verified `from`, add `/respond` CTAs, activate workflows.
- Biggest product gap: **moderation + aggregation** of traveler reports into `carrier_airline_verifications` (not automated).
- Repo branch: `claude/upbeat-lovelace-O7v2M`.
