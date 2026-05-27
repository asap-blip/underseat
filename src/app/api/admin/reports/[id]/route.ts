import { NextResponse } from "next/server";
import { moderationSchema } from "@/lib/validation/schemas";
import { getRepository } from "@/lib/data/repository";
import { isAdminTokenAuthorized } from "@/lib/auth/admin";

export const runtime = "nodejs";

// PATCH /api/admin/reports/[id] — moderate a traveler report and re-aggregate
// the affected carrier-airline verification.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminTokenAuthorized(req.headers.get("x-admin-token")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const report = await getRepository().moderateReport(id, parsed.data.moderationStatus);
    if (!report) {
      return NextResponse.json({ error: "Report not found (or no database configured)" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Moderation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
