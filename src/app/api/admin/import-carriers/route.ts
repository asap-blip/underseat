import { NextResponse } from "next/server";
import { getServiceSupabase, getSupabase } from "@/lib/supabase/client";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true;
  return req.headers.get("x-admin-token") === expected;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

// Carrier ID = slug from "brand-model", e.g. "sherpa-original-deluxe"
function makeCarrierId(brand: string, model: string): string {
  return slugify(`${brand}-${model}`);
}

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "yes", "1", "y"].includes(v.trim().toLowerCase());
  return false;
}

function parseNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface CarrierInput {
  brand: string;
  model: string;
  sku: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  maxPetWeightKg?: number | null;
  softSided: boolean;
  affiliateUrl?: string | null;
  affiliateNetwork?: string | null;
  imageUrl?: string | null;
}

function validateCarrier(
  input: Record<string, unknown>,
  index: number,
): { ok: true; carrier: CarrierInput } | { ok: false; error: string } {
  const brand = String(input.brand ?? "").trim();
  // Accept "name" or "model" as the model field
  const model = String(input.name ?? input.model ?? "").trim();
  const sku = String(input.sku ?? "").trim();
  const lengthCm = parseNum(input.lengthCm);
  const widthCm = parseNum(input.widthCm);
  const heightCm = parseNum(input.heightCm);
  const weightKg = parseNum(input.weightKg);

  if (!brand) return { ok: false, error: `Item ${index}: brand is required` };
  if (!model) return { ok: false, error: `Item ${index}: model/name is required` };
  if (lengthCm == null || lengthCm <= 0)
    return { ok: false, error: `Item ${index}: length_cm must be a positive number` };
  if (widthCm == null || widthCm <= 0)
    return { ok: false, error: `Item ${index}: width_cm must be a positive number` };
  if (heightCm == null || heightCm <= 0)
    return { ok: false, error: `Item ${index}: height_cm must be a positive number` };
  if (weightKg == null || weightKg <= 0)
    return { ok: false, error: `Item ${index}: weight_kg must be a positive number` };

  return {
    ok: true,
    carrier: {
      brand,
      model,
      sku: sku || `${slugify(brand)}-${slugify(model)}`,
      lengthCm,
      widthCm,
      heightCm,
      weightKg,
      maxPetWeightKg: parseNum(input.maxPetWeightKg),
      softSided: parseBool(input.softSided),
      affiliateUrl: String(input.affiliateUrl ?? "").trim() || null,
      affiliateNetwork: String(input.affiliateNetwork ?? "").trim() || null,
      imageUrl: String(input.imageUrl ?? "").trim() || null,
    },
  };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;

  // Accept either a `carriers` array or a single carrier object
  let rawCarriers: Record<string, unknown>[];
  if (Array.isArray(obj.carriers)) {
    rawCarriers = obj.carriers as Record<string, unknown>[];
  } else if (obj.brand) {
    rawCarriers = [obj];
  } else {
    return NextResponse.json(
      {
        error:
          "Provide either a `carriers` array or a single carrier object with at least `brand`",
      },
      { status: 400 },
    );
  }

  if (rawCarriers.length === 0) {
    return NextResponse.json({ error: "No carriers to import" }, { status: 400 });
  }

  // Validate all rows first
  const validated: { index: number; carrier: CarrierInput }[] = [];
  const errors: string[] = [];

  rawCarriers.forEach((raw, i) => {
    // Normalise snake_case keys → camelCase
    const normalised: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const k = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      normalised[k] = value;
    }
    const result = validateCarrier(normalised, i + 1);
    if (result.ok) {
      validated.push({ index: i + 1, carrier: result.carrier });
    } else {
      errors.push(result.error);
    }
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  // Build carrier ids
  const withIds = validated.map(({ carrier }) => ({
    id: makeCarrierId(carrier.brand, carrier.model),
    carrier,
  }));

  const now = new Date().toISOString();
  const supabase = getServiceSupabase() ?? getSupabase();

  // --- Static mode: log & return ---
  if (!supabase) {
    for (const item of withIds) {
      console.info(
        "[flypewpet] carrier import (static):",
        item.id,
        item.carrier.brand,
        item.carrier.model,
      );
    }
    return NextResponse.json({
      inserted: withIds.map((w) => w.id),
      skipped: 0,
      total: withIds.length,
      note: "Static mode — carriers are logged only. Run with Supabase to persist.",
    });
  }

  // --- Supabase mode: check existence & batch insert ---

  // 1. Fetch all existing ids in one query
  const allIds = withIds.map((w) => w.id);
  const { data: existingRows } = await supabase
    .from("carriers")
    .select("id")
    .in("id", allIds);

  const existingSet = new Set((existingRows ?? []).map((r: { id: string }) => r.id));

  // 2. Separate new vs skipped
  const toInsert: {
    id: string;
    brand: string;
    model: string;
    sku: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_kg: number;
    max_pet_weight_kg: number | null;
    soft_sided: boolean;
    affiliate_url: string | null;
    image_url: string | null;
    affiliate_targets: Record<string, string>;
    verification: string;
    created_at: string;
  }[] = [];

  const skipped: string[] = [];

  for (const item of withIds) {
    if (existingSet.has(item.id)) {
      skipped.push(item.id);
    } else {
      toInsert.push({
        id: item.id,
        brand: item.carrier.brand,
        model: item.carrier.model,
        sku: item.carrier.sku,
        length_cm: item.carrier.lengthCm,
        width_cm: item.carrier.widthCm,
        height_cm: item.carrier.heightCm,
        weight_kg: item.carrier.weightKg,
        max_pet_weight_kg: item.carrier.maxPetWeightKg ?? null,
        soft_sided: item.carrier.softSided,
        affiliate_url: item.carrier.affiliateUrl ?? null,
        image_url: item.carrier.imageUrl ?? null,
        affiliate_targets: item.carrier.affiliateNetwork
          ? { [item.carrier.affiliateNetwork]: item.carrier.affiliateUrl ?? "" }
          : {},
        verification: "not_verified_yet",
        created_at: now,
      });
    }
  }

  // 3. Batch insert new rows
  let insertErrors: string[] = [];
  if (toInsert.length > 0) {
    const { error: batchError } = await supabase.from("carriers").insert(toInsert);
    if (batchError) {
      // Fallback: try one by one for detailed error reporting
      insertErrors = [];
      for (const row of toInsert) {
        const { error: err } = await supabase.from("carriers").insert(row);
        if (err) {
          insertErrors.push(`${row.brand} ${row.model} (${row.id}): ${err.message}`);
        }
      }
    }
  }

  return NextResponse.json({
    inserted: toInsert
      .filter((_, i) => !insertErrors[i])
      .map((r) => r.id),
    skipped: skipped.length,
    errors: insertErrors.length > 0 ? insertErrors : undefined,
  });
}
