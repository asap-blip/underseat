import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

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
    .replace(/^-|-$/g, "");
}

// Generate a deterministic carrier id from brand + model, with a random suffix
// to avoid collisions when the same model is imported multiple times.
function makeCarrierId(brand: string, model: string): string {
  const base = `${slugify(brand)}-${slugify(model)}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
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

function validateCarrier(input: Record<string, unknown>, index: number): { ok: true; carrier: CarrierInput } | { ok: false; error: string } {
  const brand = String(input.brand ?? "").trim();
  const model = String(input.model ?? "").trim();
  const sku = String(input.sku ?? "").trim();
  const lengthCm = parseNum(input.lengthCm);
  const widthCm = parseNum(input.widthCm);
  const heightCm = parseNum(input.heightCm);
  const weightKg = parseNum(input.weightKg);

  if (!brand) return { ok: false, error: `Row ${index}: brand is required` };
  if (!model) return { ok: false, error: `Row ${index}: model is required` };
  if (!sku) return { ok: false, error: `Row ${index}: sku is required` };
  if (lengthCm == null || lengthCm <= 0) return { ok: false, error: `Row ${index}: length_cm must be a positive number` };
  if (widthCm == null || widthCm <= 0) return { ok: false, error: `Row ${index}: width_cm must be a positive number` };
  if (heightCm == null || heightCm <= 0) return { ok: false, error: `Row ${index}: height_cm must be a positive number` };
  if (weightKg == null || weightKg <= 0) return { ok: false, error: `Row ${index}: weight_kg must be a positive number` };

  return {
    ok: true,
    carrier: {
      brand,
      model,
      sku,
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

  // Accept either a single carrier object or a `carriers` array
  let rawCarriers: Record<string, unknown>[];
  if (Array.isArray(obj.carriers)) {
    rawCarriers = obj.carriers as Record<string, unknown>[];
  } else if (obj.brand) {
    rawCarriers = [obj];
  } else {
    return NextResponse.json(
      { error: "Provide either a `carriers` array or a single carrier object with at least `brand`" },
      { status: 400 },
    );
  }

  if (rawCarriers.length === 0) {
    return NextResponse.json({ error: "No carriers to import" }, { status: 400 });
  }

  // Validate all rows first
  const validated: { ok: true; carrier: CarrierInput }[] = [];
  const errors: string[] = [];

  rawCarriers.forEach((raw, i) => {
    const rowNum = i + 1;
    // Normalise CSV column names (snake_case) to our camelCase fields
    const normalised: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const k = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      normalised[k] = value;
    }
    const result = validateCarrier(normalised, rowNum);
    if (result.ok) {
      validated.push(result);
    } else {
      errors.push(result.error);
    }
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  // Build rows for insertion
  const now = new Date().toISOString();
  const rows = validated.map(({ carrier }) => ({
    id: makeCarrierId(carrier.brand, carrier.model),
    brand: carrier.brand,
    model: carrier.model,
    sku: carrier.sku,
    length_cm: carrier.lengthCm,
    width_cm: carrier.widthCm,
    height_cm: carrier.heightCm,
    weight_kg: carrier.weightKg,
    max_pet_weight_kg: carrier.maxPetWeightKg,
    soft_sided: carrier.softSided,
    affiliate_url: carrier.affiliateUrl,
    image_url: carrier.imageUrl,
    affiliate_targets: carrier.affiliateNetwork
      ? { [carrier.affiliateNetwork]: carrier.affiliateUrl }
      : {},
    verification: "not_verified_yet",
    created_at: now,
  }));

  // Try Supabase; fall back to static logging
  const supabase = getServiceSupabase();
  if (supabase) {
    const { error } = await supabase.from("carriers").insert(rows).select("id");
    if (error) {
      // Duplicate key — try inserting one by one so partial success is reported
      if (error.code === "23505") {
        const inserted: string[] = [];
        const duplicateErrors: string[] = [];
        for (const row of rows) {
          const { error: insertErr } = await supabase.from("carriers").insert(row);
          if (insertErr) {
            if (insertErr.code === "23505") {
              duplicateErrors.push(`${row.brand} ${row.model} (${row.id}): already exists`);
            } else {
              duplicateErrors.push(`${row.brand} ${row.model}: ${insertErr.message}`);
            }
          } else {
            inserted.push(row.id);
          }
        }
        return NextResponse.json({
          imported: inserted.length,
          inserted,
          errors: duplicateErrors,
          total: rows.length,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      imported: rows.length,
      inserted: rows.map((r) => r.id),
      total: rows.length,
    });
  }

  // Static mode — log and return
  for (const row of rows) {
    console.info("[flypewpet] carrier import (static):", row.brand, row.model, row.sku);
  }
  return NextResponse.json({
    imported: rows.length,
    inserted: rows.map((r) => r.id),
    total: rows.length,
    note: "Static mode — carriers are logged only. Run with Supabase to persist.",
  });
}