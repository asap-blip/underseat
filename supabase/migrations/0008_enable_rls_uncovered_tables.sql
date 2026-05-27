-- Enable Row Level Security on the tables that were left uncovered by the
-- earlier migrations and lock them down deny-by-default.
--
-- With RLS enabled and NO policies, the anon and authenticated roles get zero
-- access (no rows readable, all writes rejected). The service role has
-- BYPASSRLS, so the API routes / server actions that write these tables via the
-- service-role key continue to work. This matches the pattern already used for
-- trip_followups / traveler_reports in 0006.
--
-- These tables hold user/PII or internal analytics and have no intended public
-- access, so no public policies are added here. (The reference/catalog tables
-- — airlines, airline_rules, carriers, product_codes, affiliate_targets,
-- merchants, merchant_products, carrier_airline_verifications — keep their
-- existing public-read policies from 0001/0006.)

-- User-owned / PII data.
alter table public.users     enable row level security;
alter table public.pets      enable row level security;
alter table public.trips     enable row level security;
alter table public.trip_legs enable row level security;

-- Analytics / result tracking (may reference pet attributes; not public).
alter table public.compatibility_checks enable row level security;
alter table public.outbound_clicks      enable row level security;

-- Inbound capture forms; contain optional email (PII).
alter table public.airline_requests enable row level security;
alter table public.carrier_requests enable row level security;
