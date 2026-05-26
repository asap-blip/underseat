-- Capture carriers users want added to the curated catalog.

create table if not exists public.carrier_requests (
  id          uuid primary key default gen_random_uuid(),
  carrier     text not null,
  email       text,
  note        text,
  created_at  timestamptz not null default now()
);
