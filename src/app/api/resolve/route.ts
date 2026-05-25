import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";

export const runtime = "nodejs";

// GET /api/resolve?code=<qr-or-sku> -> resolves to a carrier for quick load.
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  const carrier = await getRepository().resolveCode(code);
  if (!carrier) return NextResponse.json({ error: "No match" }, { status: 404 });
  return NextResponse.json({ carrier });
}
