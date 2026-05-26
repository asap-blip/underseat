import type { Airline, Carrier, CheckInput } from "@/lib/data/types";
import {
  evaluateTrip,
  type LegContext,
  type TripResult,
  type Verdict,
} from "@/lib/rules/engine";
import { getRepository } from "@/lib/data/repository";

const VERDICT_RANK: Record<Verdict, number> = { NO: 0, BORDERLINE: 1, PASS: 2 };

export interface AlternativeSuggestion {
  carrier: Carrier;
  verdict: Verdict;
  // Total spare room across all legs (cm), higher is roomier headroom.
  spareCm: number;
  reasons: string[];
}

export type TripWarningCode =
  | "MULTI_AIRLINE_ITINERARY"
  | "CODESHARE_PRESENT"
  | "OPERATING_CARRIER_UNKNOWN";

export interface TripWarning {
  code: TripWarningCode;
  message: string;
}

export interface CheckResponse {
  input: CheckInput;
  carrier: Carrier;
  result: TripResult;
  alternatives: AlternativeSuggestion[];
  warnings: TripWarning[];
  meta: {
    dataSource: string;
    generatedAt: string;
    checkId?: string;
  };
}

function placeholderAirline(id: string): Airline {
  return { id, name: id, iata: "", country: null };
}

async function buildLegContexts(input: CheckInput): Promise<LegContext[]> {
  const repo = getRepository();
  return Promise.all(
    input.legs.map(async (leg) => {
      const bookingId = leg.airlineId;
      const operatingUnknown = Boolean(leg.operatingCarrierUnknown);
      const ticketCarrier = leg.marketedCarrierId || leg.airlineId;

      // Resolve which airline's rule applies: operating carrier takes priority,
      // then marketed, then booking. When the operating carrier is unknown we do
      // NOT substitute a modeled airline — we evaluate against the ticket carrier
      // for an indicative result and flag the leg as unconfirmed.
      const evalId = operatingUnknown
        ? ticketCarrier
        : leg.operatingCarrierId || leg.marketedCarrierId || leg.airlineId;

      const [bookingAirline, evalAirlineRaw] = await Promise.all([
        repo.getAirline(bookingId),
        repo.getAirline(evalId),
      ]);
      const evalAirline = evalAirlineRaw ?? placeholderAirline(evalId);
      const booking = bookingAirline ?? placeholderAirline(bookingId);

      const rule = evalAirlineRaw
        ? await repo.getRule(evalId, leg.cabin, leg.aircraftType)
        : null;

      const operatingOverride = !operatingUnknown && evalId !== bookingId;
      // Codeshare: an operating carrier is named and differs from the ticket
      // carrier. Suppressed when unknown (we surface OPERATING_CARRIER_UNKNOWN).
      const codeshare =
        !operatingUnknown && Boolean(leg.operatingCarrierId && leg.operatingCarrierId !== ticketCarrier);
      const cabinModeled = Boolean(rule && rule.cabin === leg.cabin);

      return {
        leg,
        airline: evalAirline,
        rule,
        meta: {
          evalAirline,
          bookingAirline: booking,
          operatingOverride,
          codeshare,
          operatingUnknown,
          cabinModeled,
        },
      } satisfies LegContext;
    }),
  );
}

function buildWarnings(contexts: LegContext[]): TripWarning[] {
  const warnings: TripWarning[] = [];

  const distinctEvalAirlines = new Set(contexts.map((c) => c.airline.id));
  if (distinctEvalAirlines.size > 1) {
    warnings.push({
      code: "MULTI_AIRLINE_ITINERARY",
      message:
        "Your itinerary uses more than one airline. Each leg is checked against its own airline's rules — acceptance on one airline does not carry over to another.",
    });
  }

  if (contexts.some((c) => c.meta?.codeshare)) {
    warnings.push({
      code: "CODESHARE_PRESENT",
      message:
        "One or more legs may be operated by a partner airline (codeshare). The operating carrier's pet policy is the one that applies at the gate — confirm it with that carrier.",
    });
  }

  if (contexts.some((c) => c.meta?.operatingUnknown)) {
    warnings.push({
      code: "OPERATING_CARRIER_UNKNOWN",
      message:
        "One or more legs are operated by an airline we don't model yet. Those legs are indicative only — we can't confirm them against the policy that actually applies, so confidence is reduced. Confirm the pet policy directly with the operating airline.",
    });
  }

  return warnings;
}

// Aggregate spare headroom of a carrier against a trip's tightest rule, used to
// rank alternatives. Uses sorted-dimension margins; ignores legs without rules.
function spareRoom(carrier: Carrier, contexts: LegContext[]): number {
  const carrierSorted = [carrier.lengthCm, carrier.widthCm, carrier.heightCm].sort((a, b) => b - a);
  let total = 0;
  let counted = 0;
  for (const ctx of contexts) {
    const r = ctx.rule;
    if (!r || r.maxLengthCm == null || r.maxWidthCm == null || r.maxHeightCm == null) continue;
    const maxSorted = [r.maxLengthCm, r.maxWidthCm, r.maxHeightCm].sort((a, b) => b - a);
    total += maxSorted.reduce((acc, m, i) => acc + (m - carrierSorted[i]), 0);
    counted += 1;
  }
  return counted === 0 ? -Infinity : Number((total / counted).toFixed(1));
}

function whyBetter(alt: Carrier, current: Carrier, contexts: LegContext[]): string[] {
  const reasons: string[] = [];
  if (alt.softSided && !current.softSided) {
    reasons.push("Soft-sided, so it compresses to fit more cabins");
  }
  const altSpare = spareRoom(alt, contexts);
  const curSpare = spareRoom(current, contexts);
  if (altSpare > curSpare && Number.isFinite(altSpare)) {
    reasons.push(`Roughly ${Math.round(altSpare - curSpare)} cm more clearance against your tightest airline`);
  }
  if (alt.verification === "verified" && current.verification !== "verified") {
    reasons.push("Dimensions independently verified");
  }
  if (reasons.length === 0) reasons.push("Fits every leg of your itinerary");
  return reasons;
}

async function computeAlternatives(
  current: Carrier,
  input: CheckInput,
  contexts: LegContext[],
): Promise<AlternativeSuggestion[]> {
  const repo = getRepository();
  const all = await repo.listCarriers();
  const candidates = all.filter((c) => c.id !== current.id);

  const scored: AlternativeSuggestion[] = candidates
    .map((carrier) => {
      const res = evaluateTrip(carrier, input.pet, contexts);
      return {
        carrier,
        verdict: res.overall,
        spareCm: spareRoom(carrier, contexts),
        reasons: whyBetter(carrier, current, contexts),
      };
    })
    // Only suggest carriers that pass the whole trip and actually fit.
    .filter((s) => s.verdict === "PASS" && Number.isFinite(s.spareCm) && s.spareCm >= 0)
    .sort((a, b) => b.spareCm - a.spareCm);

  return scored.slice(0, 3);
}

export async function runCheck(
  input: CheckInput,
  opts: { persist?: boolean } = {},
): Promise<CheckResponse> {
  const repo = getRepository();
  const carrier = await repo.getCarrier(input.carrierId);
  if (!carrier) {
    throw new Error(`Unknown carrier: ${input.carrierId}`);
  }

  const contexts = await buildLegContexts(input);
  const result = evaluateTrip(carrier, input.pet, contexts);
  const warnings = buildWarnings(contexts);

  // Show alternatives whenever the trip is not a clean PASS, plus a small set
  // of roomier options on PASS (without distracting from the result).
  const alternatives =
    result.overall === "PASS"
      ? (await computeAlternatives(carrier, input, contexts)).slice(0, 2)
      : await computeAlternatives(carrier, input, contexts);

  let checkId: string | undefined;
  if (opts.persist) {
    try {
      checkId = await repo.recordCheck({
        carrierId: carrier.id,
        petSpecies: input.pet.species,
        petWeightKg: input.pet.weightKg,
        overall: result.overall,
        confidence: result.confidence,
        result,
      });
    } catch (err) {
      console.error("[flypewpet] failed to persist check", err);
    }
  }

  return {
    input,
    carrier,
    result,
    alternatives,
    warnings,
    meta: {
      dataSource: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase" : "static-seed",
      generatedAt: new Date().toISOString(),
      checkId,
    },
  };
}

// ----- Share encoding -------------------------------------------------------
// Encodes the check input into a URL-safe token so results are shareable and
// recomputable without a database. (When Supabase is configured, a stored
// checkId can also be used.)
export function encodeCheck(input: CheckInput): string {
  const json = JSON.stringify(input);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCheck(token: string): CheckInput | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json) as CheckInput;
  } catch {
    return null;
  }
}

export { VERDICT_RANK };
