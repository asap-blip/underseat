-- flypewpet initial schema
-- Dimensions are centimetres, weights are kilograms.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table if not exists public.airlines (
  id          text primary key,
  name        text not null,
  iata        text not null,
  country     text
);

create table if not exists public.airline_rules (
  id                      text primary key,
  airline_id              text not null references public.airlines(id) on delete cascade,
  cabin                   text not null check (cabin in ('economy','premium_economy','business','first')),
  aircraft_type           text,
  max_length_cm           numeric,
  max_width_cm            numeric,
  max_height_cm           numeric,
  max_combined_weight_kg  numeric,
  soft_sided_requirement  text check (soft_sided_requirement in ('required','recommended')),
  aircraft_varies         boolean not null default false,
  notes                   text,
  source_url              text,
  last_verified_at        date
);
create index if not exists airline_rules_airline_idx on public.airline_rules(airline_id);

create table if not exists public.carriers (
  id                 text primary key,
  brand              text not null,
  model              text not null,
  sku                text not null,
  soft_sided         boolean not null default true,
  length_cm          numeric not null,
  width_cm           numeric not null,
  height_cm          numeric not null,
  weight_kg          numeric not null,
  max_pet_weight_kg  numeric,
  verification       text not null default 'unverified'
                       check (verification in ('verified','unverified','community')),
  image_url          text,
  affiliate_url      text,
  affiliate_targets  jsonb not null default '{}'::jsonb,
  price_usd          numeric,
  description        text,
  created_at         timestamptz not null default now()
);

create table if not exists public.product_codes (
  code        text primary key,
  carrier_id  text not null references public.carriers(id) on delete cascade
);

-- A normalized affiliate mapping so links can be swapped per network/merchant.
create table if not exists public.affiliate_targets (
  id          uuid primary key default gen_random_uuid(),
  carrier_id  text not null references public.carriers(id) on delete cascade,
  network     text not null,
  url         text not null,
  unique (carrier_id, network)
);

-- ---------------------------------------------------------------------------
-- Users / pets / trips
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique,
  email       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.pets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  name        text,
  species     text not null check (species in ('dog','cat','rabbit','bird','other')),
  weight_kg   numeric not null,
  length_cm   numeric,
  height_cm   numeric
);

create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  label       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.trip_legs (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references public.trips(id) on delete cascade,
  leg_index      int not null,
  airline_id     text references public.airlines(id),
  origin         text not null,
  destination    text not null,
  cabin          text not null,
  flight_number  text,
  aircraft_type  text
);

-- ---------------------------------------------------------------------------
-- Results + tracking
-- ---------------------------------------------------------------------------
create table if not exists public.compatibility_checks (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid references public.trips(id) on delete set null,
  carrier_id      text references public.carriers(id),
  pet_species     text,
  pet_weight_kg   numeric,
  overall_status  text not null check (overall_status in ('PASS','BORDERLINE','NO')),
  confidence      text,
  result          jsonb not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.merchants (
  id           text primary key,
  name         text not null,
  slug         text not null unique,
  website_url  text,
  created_at   timestamptz not null default now()
);

create table if not exists public.merchant_products (
  id                   text primary key,
  merchant_id          text not null references public.merchants(id) on delete cascade,
  carrier_id           text not null references public.carriers(id) on delete cascade,
  external_product_id  text not null,
  product_url          text
);

create table if not exists public.outbound_clicks (
  id          uuid primary key default gen_random_uuid(),
  carrier_id  text references public.carriers(id) on delete set null,
  network     text,
  target_url  text,
  check_id    text,
  referrer    text,
  created_at  timestamptz not null default now()
);
create index if not exists outbound_clicks_carrier_idx on public.outbound_clicks(carrier_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Reference/catalog data is publicly readable; writes for checks/clicks happen
-- via the service role from API routes. Tighten before production as needed.
-- ---------------------------------------------------------------------------
alter table public.airlines enable row level security;
alter table public.airline_rules enable row level security;
alter table public.carriers enable row level security;
alter table public.product_codes enable row level security;
alter table public.affiliate_targets enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_products enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'airlines','airline_rules','carriers','product_codes',
    'affiliate_targets','merchants','merchant_products'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (true);',
      t || '_public_read', t
    );
  end loop;
end $$;
