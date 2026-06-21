import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function GET(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && req.headers.get("x-admin-token") !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: reports, error } = await supabase
    .from("carrier_reports")
    .select(`
      *,
      carriers!carrier_reports_carrier_id_fkey(brand, model),
      airlines!carrier_reports_airline_id_fkey(name)
    `)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("fetch reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }

  return NextResponse.json({ reports });
}