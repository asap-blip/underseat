-- Capture user demand for airlines/cabins we don't model yet.

create table if not exists public.airline_requests (
  id          uuid primary key default gen_random_uuid(),
  airline     text not null,
  cabin       text,
  email       text,
  note        text,
  created_at  timestamptz not null default now()
);
