-- Traveler follow-up + verification evidence schema.
--
-- Reuses the existing reference tables created in 0001:
--   public.airlines, public.carriers, public.airline_rules
-- `airline_rules` is this project's "airline pet rules" table; an
-- `airline_pet_rules` view alias is provided below for that exact name.
--
-- New tables:
--   carrier_airline_verifications  per (carrier, airline) trust state + evidence
--   trip_followups                 opt-in capture for post-trip follow-up emails
--   traveler_reports               crowdsourced did-it-work reports (moderated)

create extension if not exists "pgcrypto";

-- Friendly alias for the requested name without forking the data model.
create or replace view public.airline_pet_rules as
  select * from public.airline_rules;

-- ---------------------------------------------------------------------------
-- Shared status domain (the five exact badge statuses)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'carrier_verification_status') then
    create type public.carrier_verification_status as enum (
      'team_verified',
      'traveler_reported',
      'not_verified_yet',
      'failed_check',
      'needs_review'
    );
  end if;
end $$;

-- updated_at trigger helper (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- carrier_airline_verifications
-- One row per (carrier, airline): the badge state plus the evidence behind it.
-- ---------------------------------------------------------------------------
create table if not exists public.carrier_airline_verifications (
  id                       uuid primary key default gen_random_uuid(),
  carrier_id               text not null references public.carriers(id) on delete cascade,
  airline_id               text not null references public.airlines(id) on delete cascade,
  -- The specific rule the verification was checked against (nullable: a
  -- traveler-reported or not-yet-verified combo may have no rule on file).
  airline_rule_id          text references public.airline_rules(id) on delete set null,

  status                   public.carrier_verification_status not null default 'not_verified_yet',
  -- How the status was reached.
  verification_method      text check (verification_method in (
                             'team_check', 'automated_rule_match', 'traveler_reports', 'manual_review'
                           )),
  explanation              text,
  last_checked_at          timestamptz,

  -- Denormalized cache of moderated traveler_reports for this combo.
  traveler_report_count    integer not null default 0 check (traveler_report_count >= 0),
  traveler_positive_count  integer not null default 0 check (traveler_positive_count >= 0),
  traveler_negative_count  integer not null default 0 check (traveler_negative_count >= 0),
  -- Model confidence in [0,1].
  confidence_score         numeric(4,3) check (confidence_score >= 0 and confidence_score <= 1),

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  unique (carrier_id, airline_id),
  -- Positives + negatives can't exceed the total report count.
  check (traveler_positive_count + traveler_negative_count <= traveler_report_count)
);

create index if not exists cav_carrier_idx on public.carrier_airline_verifications(carrier_id);
create index if not exists cav_airline_idx on public.carrier_airline_verifications(airline_id);
create index if not exists cav_status_idx  on public.carrier_airline_verifications(status);

drop trigger if exists cav_set_updated_at on public.carrier_airline_verifications;
create trigger cav_set_updated_at
  before update on public.carrier_airline_verifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trip_followups
-- Opt-in capture so we can email travelers after their trip and ask how it went.
-- Contains PII (email) — locked down under RLS; written via the service role.
-- ---------------------------------------------------------------------------
create table if not exists public.trip_followups (
  id                uuid primary key default gen_random_uuid(),
  email             text not null check (position('@' in email) > 1),
  airline_id        text references public.airlines(id) on delete set null,
  carrier_id        text references public.carriers(id) on delete set null,
  departure_date    date,
  return_date       date,
  route_text        text,

  utm_source        text,
  utm_medium        text,
  utm_campaign      text,

  consent_followup  boolean not null default false,
  followup_status   text not null default 'pending' check (followup_status in (
                      'pending', 'scheduled', 'sent', 'reminded', 'completed', 'cancelled'
                    )),
  followup_send_at  timestamptz,
  reminder_send_at  timestamptz,
  created_at        timestamptz not null default now(),

  check (return_date is null or departure_date is null or return_date >= departure_date)
);

-- Supports the scheduled-mailer query ("due, opted-in, not yet sent").
create index if not exists trip_followups_due_idx
  on public.trip_followups(followup_status, followup_send_at)
  where consent_followup;
create index if not exists trip_followups_carrier_airline_idx
  on public.trip_followups(carrier_id, airline_id);

-- ---------------------------------------------------------------------------
-- traveler_reports
-- Crowdsourced "did this carrier work on this airline" reports. Moderated
-- before they count toward a verification. Contains PII (email) — RLS-locked.
-- ---------------------------------------------------------------------------
create table if not exists public.traveler_reports (
  id                uuid primary key default gen_random_uuid(),
  trip_followup_id  uuid references public.trip_followups(id) on delete set null,
  email             text check (email is null or position('@' in email) > 1),
  airline_id        text references public.airlines(id) on delete set null,
  carrier_id        text references public.carriers(id) on delete set null,
  travel_date       date,

  outcome           text not null check (outcome in ('accepted', 'denied', 'unsure')),
  stage             text check (stage in ('check_in', 'gate', 'boarding', 'onboard')),
  notes             text,
  photo_url         text,
  -- Strength of the evidence attached to the report.
  evidence_level    text not null default 'self_reported' check (evidence_level in (
                      'self_reported', 'photo', 'boarding_pass', 'verified_document'
                    )),
  moderation_status text not null default 'needs_review' check (moderation_status in (
                      'needs_review', 'approved', 'rejected', 'spam'
                    )),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

create index if not exists traveler_reports_combo_idx
  on public.traveler_reports(carrier_id, airline_id);
create index if not exists traveler_reports_moderation_idx
  on public.traveler_reports(moderation_status);
create index if not exists traveler_reports_followup_idx
  on public.traveler_reports(trip_followup_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   verifications: world-readable (drives the public badge), writes via service role
--   trip_followups + traveler_reports: PII -> no public read; service role only
-- ---------------------------------------------------------------------------
alter table public.carrier_airline_verifications enable row level security;
alter table public.trip_followups enable row level security;
alter table public.traveler_reports enable row level security;

create policy carrier_airline_verifications_public_read
  on public.carrier_airline_verifications for select using (true);

-- (No select policies for trip_followups / traveler_reports: locked to the
--  service role, which bypasses RLS. Add scoped policies if end-user auth lands.)
