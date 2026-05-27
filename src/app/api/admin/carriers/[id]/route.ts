import { NextResponse } from "next/server";
import { carrierUpdateSchema } from "@/lib/validation/schemas";
import { getRepository } from "@/lib/data/repository";
import { isAdminTokenAuthorized } from "@/lib/auth/admin";

export const runtime = "nodejs";

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

  const parsed = carrierUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const updated = await getRepository().updateCarrier(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Carrier not found" }, { status: 404 });
    }
    return NextResponse.json({ carrier: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
