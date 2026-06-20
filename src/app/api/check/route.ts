import { NextResponse } from "next/server";
import { checkInputSchema } from "@/lib/validation/schemas";
import { encodeCheck, runCheck } from "@/lib/check/service";

export const runtime = "nodejs";

// POST /api/check
// Body: CheckInput (see src/lib/validation/schemas.ts)
// Returns the API-ready compatibility contract used by the result page and,
// in future, the embeddable merchant widget.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const response = await runCheck(parsed.data, { persist: true });
    return NextResponse.json({
      ...response,
      shareToken: encodeCheck(parsed.data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Underseat compatibility check",
    method: "POST",
    contract: "CheckInput -> CheckResponse",
  });
}
