import { NextResponse } from "next/server";
import { carrierRequestSchema } from "@/lib/validation/schemas";
import { getRepository } from "@/lib/data/repository";
import { sendCarrierSuggestionEmail } from "@/lib/email";

export const runtime = "nodejs";

// POST /api/carrier-requests — captures carriers users want added to the catalog.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = carrierRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    await getRepository().recordCarrierRequest({
      carrier: parsed.data.carrier.trim(),
      email: parsed.data.email || null,
      note: parsed.data.note ?? null,
    });

    // Send email notification (fire-and-forget; won't block response if credentials missing)
    sendCarrierSuggestionEmail({
      carrierName: parsed.data.carrier.trim(),
      email: parsed.data.email || undefined,
      submittedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
