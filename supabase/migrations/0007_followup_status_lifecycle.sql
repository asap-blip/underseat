-- Tighten trip_followups.followup_status to the canonical lifecycle:
--   pending -> sent -> reminded -> completed -> cancelled
-- Removes the unused 'scheduled' value. The app inserts 'pending', the n8n
-- follow-up workflow moves it to 'sent', the reminder workflow to 'reminded',
-- and a future traveler-response path writes 'completed'. 'scheduled' was never
-- written by any layer, so dropping it is safe.

alter table public.trip_followups drop constraint if exists trip_followups_followup_status_check;

-- Safety net: fold any legacy 'scheduled' rows back into 'pending'.
update public.trip_followups set followup_status = 'pending' where followup_status = 'scheduled';

alter table public.trip_followups
  add constraint trip_followups_followup_status_check
  check (followup_status in ('pending', 'sent', 'reminded', 'completed', 'cancelled'));
