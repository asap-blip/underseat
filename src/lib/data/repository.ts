import type {
  Airline,
  AirlineRule,
  Carrier,
  CabinType,
  Merchant,
  MerchantProduct,
} from "./types";
import type { TripResult, Verdict } from "@/lib/rules/engine";
import {
  airlineRules,
  airlines as seedAirlines,
  carriers as seedCarriers,
  merchantProducts as seedMerchantProducts,
  merchants as seedMerchants,
  productCodes,
} from "./seed";
import {
  getServiceSupabase,
  getSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export interface CheckRecord {
  carrierId: string;
  petSpecies: string;
  petWeightKg: number;
  overall: Verdict;
  confidence: string;
  result: TripResult;
}

export interface ClickRecord {
  carrierId: string;
  network: string;
  targetUrl: string;
  checkId?: string | null;
  referrer?: string | null;
}

export interface Repository {
  listCarriers(query?: string): Promise<Carrier[]>;
  getCarrier(id: string): Promise<Carrier | null>;
  resolveCode(code: string): Promise<Carrier | null>;
  listAirlines(): Promise<Airline[]>;
  getAirline(id: string): Promise<Airline | null>;
  getRule(
    airlineId: string,
    cabin: CabinType,
    aircraftType?: string | null,
  ): Promise<AirlineRule | null>;
  listMerchants(): Promise<Merchant[]>;
  getMerchantBySlug(slug: string): Promise<Merchant | null>;
  listMerchantProducts(merchantId: string): Promise<MerchantProduct[]>;
  recordCheck(record: CheckRecord): Promise<string>;
  recordClick(record: ClickRecord): Promise<void>;
}

function matchesQuery(carrier: Carrier, q: string): boolean {
  const haystack = `${carrier.brand} ${carrier.model} ${carrier.sku}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function pickRule(
  airlineId: string,
  cabin: CabinType,
  aircraftType: string | null | undefined,
  rules: AirlineRule[],
): AirlineRule | null {
  const forAirline = rules.filter((r) => r.airlineId === airlineId);
  if (forAirline.length === 0) return null;
  // 1. Exact cabin + aircraft match.
  if (aircraftType) {
    const exact = forAirline.find(
      (r) => r.cabin === cabin && r.aircraftType === aircraftType,
    );
    if (exact) return exact;
  }
  // 2. Cabin default (no specific aircraft).
  const cabinDefault = forAirline.find(
    (r) => r.cabin === cabin && (r.aircraftType == null),
  );
  if (cabinDefault) return cabinDefault;
  // 3. Any rule for the cabin.
  const anyCabin = forAirline.find((r) => r.cabin === cabin);
  if (anyCabin) return anyCabin;
  // 4. Fall back to the airline's economy rule.
  return forAirline.find((r) => r.cabin === "economy") ?? null;
}

// ---------------------------------------------------------------------------
// Static repository (default). Backed by the bundled seed; writes are logged
// to the server console so the app is fully functional without a database.
// ---------------------------------------------------------------------------
class StaticRepository implements Repository {
  async listCarriers(query?: string): Promise<Carrier[]> {
    if (!query) return seedCarriers;
    return seedCarriers.filter((c) => matchesQuery(c, query));
  }
  async getCarrier(id: string): Promise<Carrier | null> {
    return seedCarriers.find((c) => c.id === id) ?? null;
  }
  async resolveCode(code: string): Promise<Carrier | null> {
    const normalized = code.trim().toUpperCase();
    const direct = productCodes.find((p) => p.code.toUpperCase() === normalized);
    if (direct) return this.getCarrier(direct.carrierId);
    // Also accept a raw SKU or carrier id as a code.
    const bySku = seedCarriers.find(
      (c) => c.sku.toUpperCase() === normalized || c.id.toUpperCase() === normalized,
    );
    return bySku ?? null;
  }
  async listAirlines(): Promise<Airline[]> {
    return seedAirlines;
  }
  async getAirline(id: string): Promise<Airline | null> {
    return seedAirlines.find((a) => a.id === id) ?? null;
  }
  async getRule(
    airlineId: string,
    cabin: CabinType,
    aircraftType?: string | null,
  ): Promise<AirlineRule | null> {
    return pickRule(airlineId, cabin, aircraftType, airlineRules);
  }
  async listMerchants(): Promise<Merchant[]> {
    return seedMerchants;
  }
  async getMerchantBySlug(slug: string): Promise<Merchant | null> {
    return seedMerchants.find((m) => m.slug === slug) ?? null;
  }
  async listMerchantProducts(merchantId: string): Promise<MerchantProduct[]> {
    return seedMerchantProducts.filter((m) => m.merchantId === merchantId);
  }
  async recordCheck(record: CheckRecord): Promise<string> {
    const id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    console.info("[flypewpet] compatibility_check (static):", id, record.carrierId, record.overall);
    return id;
  }
  async recordClick(record: ClickRecord): Promise<void> {
    console.info("[flypewpet] outbound_click (static):", record.carrierId, record.network);
  }
}

// ---------------------------------------------------------------------------
// Supabase repository. Activated when NEXT_PUBLIC_SUPABASE_URL + anon key are
// present. Column names follow the snake_case schema in supabase/migrations.
// ---------------------------------------------------------------------------
function carrierFromRow(r: Record<string, unknown>): Carrier {
  return {
    id: String(r.id),
    brand: String(r.brand),
    model: String(r.model),
    sku: String(r.sku),
    softSided: Boolean(r.soft_sided),
    lengthCm: Number(r.length_cm),
    widthCm: Number(r.width_cm),
    heightCm: Number(r.height_cm),
    weightKg: Number(r.weight_kg),
    maxPetWeightKg: r.max_pet_weight_kg == null ? null : Number(r.max_pet_weight_kg),
    verification: (r.verification as Carrier["verification"]) ?? "unverified",
    imageUrl: (r.image_url as string) ?? null,
    affiliateUrl: (r.affiliate_url as string) ?? null,
    affiliateTargets: (r.affiliate_targets as Record<string, string>) ?? {},
    priceUsd: r.price_usd == null ? null : Number(r.price_usd),
    description: (r.description as string) ?? null,
  };
}

function ruleFromRow(r: Record<string, unknown>): AirlineRule {
  return {
    id: String(r.id),
    airlineId: String(r.airline_id),
    cabin: r.cabin as CabinType,
    aircraftType: (r.aircraft_type as string) ?? null,
    maxLengthCm: r.max_length_cm == null ? null : Number(r.max_length_cm),
    maxWidthCm: r.max_width_cm == null ? null : Number(r.max_width_cm),
    maxHeightCm: r.max_height_cm == null ? null : Number(r.max_height_cm),
    maxCombinedWeightKg:
      r.max_combined_weight_kg == null ? null : Number(r.max_combined_weight_kg),
    softSidedRequirement: (r.soft_sided_requirement as AirlineRule["softSidedRequirement"]) ?? null,
    aircraftVaries: Boolean(r.aircraft_varies),
    notes: (r.notes as string) ?? null,
    sourceUrl: (r.source_url as string) ?? null,
    lastVerifiedAt: (r.last_verified_at as string) ?? null,
  };
}

class SupabaseRepository implements Repository {
  async listCarriers(query?: string): Promise<Carrier[]> {
    const sb = getSupabase();
    if (!sb) return [];
    let q = sb.from("carriers").select("*").order("brand");
    if (query) q = q.or(`brand.ilike.%${query}%,model.ilike.%${query}%,sku.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(carrierFromRow);
  }
  async getCarrier(id: string): Promise<Carrier | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from("carriers").select("*").eq("id", id).maybeSingle();
    return data ? carrierFromRow(data) : null;
  }
  async resolveCode(code: string): Promise<Carrier | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const normalized = code.trim().toUpperCase();
    const { data: codeRow } = await sb
      .from("product_codes")
      .select("carrier_id")
      .ilike("code", normalized)
      .maybeSingle();
    if (codeRow?.carrier_id) return this.getCarrier(String(codeRow.carrier_id));
    const { data } = await sb
      .from("carriers")
      .select("*")
      .or(`sku.ilike.${normalized},id.ilike.${normalized}`)
      .maybeSingle();
    return data ? carrierFromRow(data) : null;
  }
  async listAirlines(): Promise<Airline[]> {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from("airlines").select("*").order("name");
    return (data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      iata: String(r.iata),
      country: (r.country as string) ?? null,
    }));
  }
  async getAirline(id: string): Promise<Airline | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from("airlines").select("*").eq("id", id).maybeSingle();
    return data
      ? { id: String(data.id), name: String(data.name), iata: String(data.iata), country: (data.country as string) ?? null }
      : null;
  }
  async getRule(
    airlineId: string,
    cabin: CabinType,
    aircraftType?: string | null,
  ): Promise<AirlineRule | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from("airline_rules").select("*").eq("airline_id", airlineId);
    return pickRule(airlineId, cabin, aircraftType, (data ?? []).map(ruleFromRow));
  }
  async listMerchants(): Promise<Merchant[]> {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from("merchants").select("*").order("name");
    return (data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      websiteUrl: (r.website_url as string) ?? null,
    }));
  }
  async getMerchantBySlug(slug: string): Promise<Merchant | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.from("merchants").select("*").eq("slug", slug).maybeSingle();
    return data
      ? { id: String(data.id), name: String(data.name), slug: String(data.slug), websiteUrl: (data.website_url as string) ?? null }
      : null;
  }
  async listMerchantProducts(merchantId: string): Promise<MerchantProduct[]> {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb.from("merchant_products").select("*").eq("merchant_id", merchantId);
    return (data ?? []).map((r) => ({
      id: String(r.id),
      merchantId: String(r.merchant_id),
      carrierId: String(r.carrier_id),
      externalProductId: String(r.external_product_id),
      productUrl: (r.product_url as string) ?? null,
    }));
  }
  async recordCheck(record: CheckRecord): Promise<string> {
    const sb = getServiceSupabase() ?? getSupabase();
    if (!sb) return `nodb_${Date.now()}`;
    const { data, error } = await sb
      .from("compatibility_checks")
      .insert({
        carrier_id: record.carrierId,
        pet_species: record.petSpecies,
        pet_weight_kg: record.petWeightKg,
        overall_status: record.overall,
        confidence: record.confidence,
        result: record.result,
      })
      .select("id")
      .single();
    if (error) throw error;
    return String(data.id);
  }
  async recordClick(record: ClickRecord): Promise<void> {
    const sb = getServiceSupabase() ?? getSupabase();
    if (!sb) return;
    await sb.from("outbound_clicks").insert({
      carrier_id: record.carrierId,
      network: record.network,
      target_url: record.targetUrl,
      check_id: record.checkId ?? null,
      referrer: record.referrer ?? null,
    });
  }
}

let cached: Repository | null = null;

export function getRepository(): Repository {
  if (cached) return cached;
  cached = isSupabaseConfigured() ? new SupabaseRepository() : new StaticRepository();
  return cached;
}

export const dataSourceLabel = isSupabaseConfigured() ? "supabase" : "static-seed";
