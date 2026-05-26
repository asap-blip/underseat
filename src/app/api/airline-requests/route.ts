import { NextResponse } from "next/server";
import { airlineRequestSchema } from "@/lib/validation/schemas";
import { getRepository } from "@/lib/data/repository";

export const runtime = "nodejs";

// POST /api/airline-requests — captures which airlines/cabins users want next.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = airlineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    await getRepository().recordAirlineRequest({
      airline: parsed.data.airline.trim(),
      cabin: parsed.data.cabin ?? null,
      email: parsed.data.email || null,
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
