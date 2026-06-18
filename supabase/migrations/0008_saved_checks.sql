-- saved_checks — email capture on the result page so users can save their
-- check and get a reminder. Written via the service role from API routes.
-- Contains PII (email) — RLS-locked to service-role writes only.

create extension if not exists "pgcrypto";

create table if not exists public.saved_checks (
  id              uuid primary key default gen_random_uuid(),
  email           text not null check (position('@' in email) > 1),
  share_token     text not null,
  carrier_id      text references public.carriers(id) on delete set null,
  airline_id      text references public.airlines(id) on delete set null,
  overall_status  text check (overall_status in ('PASS', 'BORDERLINE', 'NO')),
  route_text      text,
  departure_date  date,
  consent_email   boolean not null default true,
  email_sent      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists saved_checks_email_idx on public.saved_checks(email);
create index if not exists saved_checks_token_idx on public.saved_checks(share_token);

alter table public.saved_checks enable row level security;

-- No public select — PII. Service role bypasses RLS.
