import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { email, carrierId, airlineId, routeText, notes, source } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { error } = await supabase.from("lead_captures").insert({
      email,
      carrier_id: carrierId || null,
      airline_id: airlineId || null,
      route_text: routeText || null,
      notes: notes || null,
      source: source || "no-fit",
    });

    if (error) {
      console.error("lead_captures insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}