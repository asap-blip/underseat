-- Evidence-based carrier status: replaces verified/unverified/community with
-- team_verified / traveler_reported / not_verified_yet (+ failed_check,
-- needs_review for future use). Adds a traveler_reports count.

alter table public.carriers drop constraint if exists carriers_verification_check;

update public.carriers set verification = case verification
  when 'verified'   then 'team_verified'
  when 'community'  then 'traveler_reported'
  when 'unverified' then 'not_verified_yet'
  else verification
end;

alter table public.carriers alter column verification set default 'not_verified_yet';

alter table public.carriers
  add constraint carriers_verification_check
  check (verification in ('team_verified','traveler_reported','not_verified_yet','failed_check','needs_review'));

alter table public.carriers add column if not exists traveler_reports integer;
