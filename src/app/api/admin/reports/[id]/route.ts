import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Simple admin auth via header
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && req.headers.get("x-admin-token") !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await req.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Fetch the report
    const { data: report, error: fetchError } = await supabase
      .from("carrier_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === "reject") {
      const { error } = await supabase
        .from("carrier_reports")
        .update({ status: "rejected", reviewed_at: now })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // Approve: update report + carrier
    const { error: updateError } = await supabase
      .from("carrier_reports")
      .update({ status: "approved", reviewed_at: now })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: carrierError } = await supabase
      .from("carriers")
      .update({
        verification: "team_verified",
        verified_at: now.split("T")[0],
      })
      .eq("id", report.carrier_id);

    if (carrierError) throw carrierError;

    return NextResponse.json({ ok: true, status: "approved" });
  } catch (err) {
    console.error("Admin reports error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}