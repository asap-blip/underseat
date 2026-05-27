"use server";

import { travelerResponseSchema } from "@/lib/validation/schemas";
import { getServiceSupabase } from "@/lib/supabase/client";

// Friendly UI outcome -> traveler_reports.outcome CHECK value.
const OUTCOME_DB: Record<string, "accepted" | "denied" | "unsure"> = {
  worked: "accepted",
  did_not_work: "denied",
  mixed: "unsure",
};

export interface TravelerResponseResult {
  ok: boolean;
  error?: string;
  // false when Supabase isn't configured (dev/static): accepted but not stored.
  persisted?: boolean;
  alreadyCompleted?: boolean;
}

export async function submitTravelerResponse(input: unknown): Promise<TravelerResponseResult> {
  const parsed = travelerResponseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please pick an outcome and try again." };
  }
  const d = parsed.data;

  const sb = getServiceSupabase();
  if (!sb) {
    console.info("[flypewpet] traveler_response (no Supabase configured):", d.followupId, d.outcome);
    return { ok: true, persisted: false };
  }

  // Load the follow-up server-side: the report's email/airline/carrier/date come
  // from the trusted row, never the client. Also re-checks state.
  const { data: followup, error: loadError } = await sb
    .from("trip_followups")
    .select("id, email, airline_id, carrier_id, departure_date, followup_status")
    .eq("id", d.followupId)
    .maybeSingle();

  if (loadError) {
    console.error("[flypewpet] traveler_response load failed", loadError);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if (!followup) {
    return { ok: false, error: "We couldn't find that trip." };
  }
  if (followup.followup_status === "cancelled") {
    return { ok: false, error: "This follow-up was cancelled." };
  }
  if (followup.followup_status === "completed") {
    return { ok: true, alreadyCompleted: true, persisted: true };
  }

  const { error: insertError } = await sb.from("traveler_reports").insert({
    trip_followup_id: followup.id,
    email: followup.email,
    airline_id: followup.airline_id,
    carrier_id: followup.carrier_id,
    travel_date: followup.departure_date,
    outcome: OUTCOME_DB[d.outcome],
    stage: d.stage ?? null,
    notes: d.notes ?? null,
    // evidence_level + moderation_status use their DB defaults
    // (self_reported / needs_review).
  });
  if (insertError) {
    console.error("[flypewpet] traveler_report insert failed", insertError);
    return { ok: false, error: "Something went wrong saving your answer. Please try again." };
  }

  // Mark complete so reminder emails stop. Lifecycle: ... -> completed.
  const { error: updateError } = await sb
    .from("trip_followups")
    .update({ followup_status: "completed" })
    .eq("id", followup.id);
  if (updateError) {
    // The report was saved; the status flip failing is non-fatal but worth logging.
    console.error("[flypewpet] trip_followup complete update failed", updateError);
  }

  return { ok: true, persisted: true };
}
