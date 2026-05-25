import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";
import { resolveAffiliateTarget } from "@/lib/affiliate";

export const runtime = "nodejs";

// GET /api/click?carrier=<id>&network=<network>&check=<token>
// Records an outbound affiliate click server-side, then 302-redirects to the
// affiliate destination.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const carrierId = url.searchParams.get("carrier");
  const network = url.searchParams.get("network") ?? "amazon";
  const checkToken = url.searchParams.get("check");

  if (!carrierId) {
    return NextResponse.json({ error: "Missing carrier" }, { status: 400 });
  }

  const repo = getRepository();
  const carrier = await repo.getCarrier(carrierId);
  if (!carrier) {
    return NextResponse.json({ error: "Unknown carrier" }, { status: 404 });
  }

  const target = resolveAffiliateTarget(carrier, network);
  if (!target) {
    return NextResponse.json({ error: "No affiliate link for carrier" }, { status: 404 });
  }

  try {
    await repo.recordClick({
      carrierId,
      network: target.network,
      targetUrl: target.url,
      checkId: checkToken ?? null,
      referrer: req.headers.get("referer"),
    });
  } catch (err) {
    // Never block the outbound redirect on a tracking failure.
    console.error("[flypewpet] click tracking failed", err);
  }

  return NextResponse.redirect(target.url, 302);
}
