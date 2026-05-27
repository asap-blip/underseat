"use server";

import { tripFollowupSchema } from "@/lib/validation/schemas";
import { getServiceSupabase } from "@/lib/supabase/client";

const HOURS = 3600 * 1000;
const DAYS = 24 * HOURS;
// When to send the "did it work?" email and a later nudge, relative to departure.
const FOLLOWUP_AFTER_DEPARTURE_HOURS = 18;
const REMINDER_AFTER_FOLLOWUP_DAYS = 3;

export interface TripFollowupResult {
  ok: boolean;
  error?: string;
  // false when Supabase isn't configured (dev/static) — captured but not stored.
  persisted?: boolean;
}

export async function submitTripFollowup(input: unknown): Promise<TripFollowupResult> {
  const parsed = tripFollowupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const d = parsed.data;
  if (!d.consentFollowup) {
    return { ok: false, error: "Please tick the box so we know it's OK to email you." };
  }

  const departure = new Date(`${d.departureDate}T00:00:00Z`);
  if (Number.isNaN(departure.getTime())) {
    return { ok: false, error: "That departure date doesn't look right." };
  }

  const followupSendAt = new Date(departure.getTime() + FOLLOWUP_AFTER_DEPARTURE_HOURS * HOURS);
  const reminderSendAt = new Date(followupSendAt.getTime() + REMINDER_AFTER_FOLLOWUP_DAYS * DAYS);

  const row = {
    email: d.email.trim(),
    airline_id: d.airlineId || null,
    carrier_id: d.carrierId || null,
    departure_date: d.departureDate,
    return_date: d.returnDate || null,
    route_text: d.routeText || null,
    utm_source: d.utmSource || null,
    utm_medium: d.utmMedium || null,
    utm_campaign: d.utmCampaign || null,
    consent_followup: d.consentFollowup,
    // 'pending' = due to send but not yet sent; the n8n follow-up workflow
    // picks these up and flips them to 'sent'.
    followup_status: "pending" as const,
    followup_send_at: followupSendAt.toISOString(),
    reminder_send_at: reminderSendAt.toISOString(),
  };

  const sb = getServiceSupabase();
  if (!sb) {
    // No DB configured (local/static): accept the opt-in without persisting.
    console.info("[flypewpet] trip_followup (no Supabase configured):", row.email, row.followup_send_at);
    return { ok: true, persisted: false };
  }

  const { error } = await sb.from("trip_followups").insert(row);
  if (error) {
    console.error("[flypewpet] trip_followup insert failed", error);
    return { ok: false, error: "Something went wrong saving your trip. Please try again." };
  }
  return { ok: true, persisted: true };
}
