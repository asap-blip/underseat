import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/client";

const saveCheckSchema = z.object({
  email: z.string().email().max(160),
  shareToken: z.string().min(1),
  carrierId: z.string().max(60).optional().nullable(),
  airlineId: z.string().max(60).optional().nullable(),
  overallStatus: z.enum(["PASS", "BORDERLINE", "NO"]).optional().nullable(),
  routeText: z.string().max(200).optional().nullable(),
  departureDate: z.string().optional().nullable(),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = saveCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const row = {
    email: d.email.trim(),
    share_token: d.shareToken,
    carrier_id: d.carrierId || null,
    airline_id: d.airlineId || null,
    overall_status: d.overallStatus || null,
    route_text: d.routeText || null,
    departure_date: d.departureDate || null,
    consent_email: true,
  };

  // Try Supabase first; fall back to console logging (graceful without DB).
  const sb = getServiceSupabase();
  if (sb) {
    const { error } = await sb.from("saved_checks").insert(row);
    if (error) {
      console.error("[flypewpet] saved_checks insert failed", error);
      return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, persisted: true });
  }

  // No Supabase configured — log gracefully.
  console.info("[flypewpet] saved_check (no Supabase):", row.email, row.share_token.slice(0, 12));
  return NextResponse.json({ ok: true, persisted: false });
}
