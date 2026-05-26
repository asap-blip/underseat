import type {
  Airline,
  AirlineRule,
  Carrier,
  Pet,
  TripLegInput,
} from "@/lib/data/types";
import type { Reason, ReasonSeverity } from "./reasonCodes";
import { REASON_LABELS } from "./reasonCodes";
import { freshness } from "@/lib/freshness";

export type Verdict = "PASS" | "BORDERLINE" | "NO";
export type ConfidenceBand = "high" | "medium" | "low";

// Soft-sided bags can compress slightly, so an overage within this margin is
// treated as BORDERLINE rather than a hard NO. Hard-sided bags get no margin.
const SOFT_MARGIN_CM = 2.5;
// Weight overage within this fraction of the limit is BORDERLINE not NO.
const WEIGHT_BORDERLINE_FRACTION = 0.05;

export interface RuleSnapshot {
  ruleId: string | null;
  airlineId: string;
  cabin: string;
  aircraftType: string | null;
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  maxCombinedWeightKg: number | null;
  softSidedRequirement: AirlineRule["softSidedRequirement"];
  sourceUrl: string | null;
  sourceLabel: string | null;
  sourceType: AirlineRule["sourceType"];
  lastVerifiedAt: string | null;
  notes: string | null;
}

export interface LegResult {
  legIndex: number;
  // Airline actually used for rule evaluation (operating carrier when overridden).
  airlineId: string;
  airlineName: string;
  // The airline the traveler selected for the leg (booking/marketing airline).
  bookingAirlineId: string;
  bookingAirlineName: string;
  origin: string;
  destination: string;
  cabin: string;
  // True when the operating carrier replaced the booking airline for evaluation.
  operatingOverride: boolean;
  // True when this leg may be operated by a partner (codeshare).
  codeshare: boolean;
  // True when the operating airline is known to differ but isn't modeled, so the
  // verdict is indicative only (confidence capped, PASS downgraded to BORDERLINE).
  operatingUnknown: boolean;
  // True when the requested cabin had its own modeled rule; false => economy fallback.
  cabinModeled: boolean;
  verdict: Verdict;
  confidence: ConfidenceBand;
  // Plain-language reasons confidence is below "high" (empty when high).
  confidenceReasons: string[];
  reasons: Reason[];
  ruleSnapshot: RuleSnapshot | null;
  // Per-dimension comparison for the results table (cm).
  comparison: DimensionComparison[];
}

export interface LegMeta {
  // Airline used for evaluation (resolved: operating > marketed > booking).
  evalAirline: Airline;
  // Airline the traveler selected (booking/marketing).
  bookingAirline: Airline;
  operatingOverride: boolean;
  codeshare: boolean;
  operatingUnknown: boolean;
  cabinModeled: boolean;
}

export interface DimensionComparison {
  dimension: "length" | "width" | "height" | "weight";
  carrierValue: number;
  ruleMax: number | null;
  unit: "cm" | "kg";
  status: "ok" | "borderline" | "over" | "unknown";
}

export interface TripResult {
  overall: Verdict;
  confidence: ConfidenceBand;
  // Aggregated, de-duplicated confidence reasons across all legs.
  confidenceReasons: string[];
  legs: LegResult[];
}

const SEVERITY_RANK: Record<ReasonSeverity, number> = {
  pass: 0,
  info: 1,
  warn: 2,
  fail: 3,
};

function reason(
  code: Reason["code"],
  severity: ReasonSeverity,
  dimension?: Reason["dimension"],
  messageOverride?: string,
): Reason {
  return {
    code,
    severity,
    dimension,
    message: messageOverride ?? REASON_LABELS[code],
  };
}

function verdictFromReasons(reasons: Reason[]): Verdict {
  const worst = reasons.reduce(
    (acc, r) => Math.max(acc, SEVERITY_RANK[r.severity]),
    0,
  );
  if (worst >= SEVERITY_RANK.fail) return "NO";
  if (worst >= SEVERITY_RANK.warn) return "BORDERLINE";
  return "PASS";
}

// Sorted descending so we compare the carrier's longest side against the
// rule's longest allowance — orientation-independent "does the box fit" check.
function sortedDims(l: number, w: number, h: number): number[] {
  return [l, w, h].sort((a, b) => b - a);
}

const DIM_CODE = {
  exceeded: [
    "DIMENSION_LENGTH_EXCEEDED",
    "DIMENSION_WIDTH_EXCEEDED",
    "DIMENSION_HEIGHT_EXCEEDED",
  ],
  borderline: [
    "DIMENSION_LENGTH_BORDERLINE",
    "DIMENSION_WIDTH_BORDERLINE",
    "DIMENSION_HEIGHT_BORDERLINE",
  ],
} as const;

const DIM_NAME = ["length", "width", "height"] as const;

export function evaluateLeg(
  carrier: Carrier,
  pet: Pet,
  leg: TripLegInput,
  airline: Airline,
  rule: AirlineRule | null,
  legIndex: number,
  meta?: LegMeta,
): LegResult {
  const reasons: Reason[] = [];
  const comparison: DimensionComparison[] = [];

  // Resolve leg metadata; default to no override / no codeshare so callers that
  // pass only the evaluation airline (e.g. unit tests) still work.
  const bookingAirline = meta?.bookingAirline ?? airline;
  const operatingOverride = meta?.operatingOverride ?? false;
  const codeshare = meta?.codeshare ?? false;
  const operatingUnknown = meta?.operatingUnknown ?? false;
  const cabinModeled = meta?.cabinModeled ?? (rule ? rule.cabin === leg.cabin : false);

  // Advisory reasons. Most are info (don't change the verdict), but an unknown
  // operating carrier is a `warn`: without the airline that actually applies, we
  // must not return a confident PASS.
  if (operatingOverride) reasons.push(reason("OPERATING_CARRIER_USED", "info"));
  if (operatingUnknown) reasons.push(reason("OPERATING_CARRIER_UNKNOWN", "warn"));
  if (codeshare && !operatingUnknown) reasons.push(reason("CODESHARE_PARTNER_OPERATED", "info"));
  if (!cabinModeled && rule) reasons.push(reason("CABIN_NOT_MODELED", "info"));

  const legFlags = {
    bookingAirlineId: bookingAirline.id,
    bookingAirlineName: bookingAirline.name,
    operatingOverride,
    codeshare,
    operatingUnknown,
    cabinModeled,
  };

  // Plain-language explanations for any confidence reduction.
  const confidenceReasons: string[] = [];
  if (operatingUnknown) {
    confidenceReasons.push("The airline that actually operates this leg isn't modeled, so we can't confirm its policy.");
  }

  const ruleSnapshot: RuleSnapshot | null = rule
    ? {
        ruleId: rule.id,
        airlineId: rule.airlineId,
        cabin: rule.cabin,
        aircraftType: rule.aircraftType ?? null,
        maxLengthCm: rule.maxLengthCm,
        maxWidthCm: rule.maxWidthCm,
        maxHeightCm: rule.maxHeightCm,
        maxCombinedWeightKg: rule.maxCombinedWeightKg,
        softSidedRequirement: rule.softSidedRequirement,
        sourceUrl: rule.sourceUrl ?? null,
        sourceLabel: rule.sourceLabel ?? null,
        sourceType: rule.sourceType ?? null,
        lastVerifiedAt: rule.lastVerifiedAt ?? null,
        notes: rule.notes ?? null,
      }
    : null;

  // ----- No rule on file at all -------------------------------------------
  if (!rule) {
    reasons.push(reason("INCOMPLETE_RULE_DATA", "warn"));
    reasons.push(reason("FINAL_APPROVAL_AIRLINE_DISCRETION", "info"));
    confidenceReasons.push("We have no published in-cabin rule for this airline and cabin.");
    return {
      legIndex,
      airlineId: airline.id,
      airlineName: airline.name,
      ...legFlags,
      origin: leg.origin,
      destination: leg.destination,
      cabin: leg.cabin,
      verdict: verdictFromReasons(reasons),
      confidence: "low",
      confidenceReasons,
      reasons,
      ruleSnapshot,
      comparison,
    };
  }

  // ----- Dimension checks --------------------------------------------------
  const haveAllMax =
    rule.maxLengthCm != null &&
    rule.maxWidthCm != null &&
    rule.maxHeightCm != null;

  if (haveAllMax) {
    const carrierSorted = sortedDims(
      carrier.lengthCm,
      carrier.widthCm,
      carrier.heightCm,
    );
    const maxSorted = sortedDims(
      rule.maxLengthCm as number,
      rule.maxWidthCm as number,
      rule.maxHeightCm as number,
    );
    const margin = carrier.softSided ? SOFT_MARGIN_CM : 0;

    carrierSorted.forEach((value, i) => {
      const max = maxSorted[i];
      const over = value - max;
      const name = DIM_NAME[i];
      let status: DimensionComparison["status"] = "ok";
      if (over > margin) {
        status = "over";
        reasons.push(reason(DIM_CODE.exceeded[i], "fail", name));
      } else if (over > 0) {
        status = "borderline";
        reasons.push(reason(DIM_CODE.borderline[i], "warn", name));
      }
      comparison.push({
        dimension: name,
        carrierValue: value,
        ruleMax: max,
        unit: "cm",
        status,
      });
    });

    if (!reasons.some((r) => r.code.startsWith("DIMENSION_"))) {
      reasons.push(reason("FITS_ALL_DIMENSIONS", "pass"));
    }
  } else {
    reasons.push(reason("INCOMPLETE_RULE_DATA", "warn"));
    comparison.push(
      { dimension: "length", carrierValue: carrier.lengthCm, ruleMax: rule.maxLengthCm, unit: "cm", status: rule.maxLengthCm == null ? "unknown" : "ok" },
      { dimension: "width", carrierValue: carrier.widthCm, ruleMax: rule.maxWidthCm, unit: "cm", status: rule.maxWidthCm == null ? "unknown" : "ok" },
      { dimension: "height", carrierValue: carrier.heightCm, ruleMax: rule.maxHeightCm, unit: "cm", status: rule.maxHeightCm == null ? "unknown" : "ok" },
    );
  }

  // ----- Weight check ------------------------------------------------------
  const combinedWeight = carrier.weightKg + pet.weightKg;
  if (rule.maxCombinedWeightKg != null) {
    const over = combinedWeight - rule.maxCombinedWeightKg;
    let status: DimensionComparison["status"] = "ok";
    if (over > rule.maxCombinedWeightKg * WEIGHT_BORDERLINE_FRACTION) {
      status = "over";
      reasons.push(reason("WEIGHT_LIMIT_EXCEEDED", "fail", "weight"));
    } else if (over > 0) {
      status = "borderline";
      reasons.push(reason("WEIGHT_LIMIT_BORDERLINE", "warn", "weight"));
    }
    comparison.push({
      dimension: "weight",
      carrierValue: Number(combinedWeight.toFixed(2)),
      ruleMax: rule.maxCombinedWeightKg,
      unit: "kg",
      status,
    });
  } else {
    comparison.push({
      dimension: "weight",
      carrierValue: Number(combinedWeight.toFixed(2)),
      ruleMax: null,
      unit: "kg",
      status: "unknown",
    });
  }

  // ----- Soft-sided requirement -------------------------------------------
  if (rule.softSidedRequirement === "required" && !carrier.softSided) {
    reasons.push(reason("SOFT_SIDED_REQUIRED", "fail"));
  } else if (rule.softSidedRequirement === "recommended" && !carrier.softSided) {
    reasons.push(reason("SOFT_SIDED_RECOMMENDED", "warn"));
  }

  // ----- Aircraft / cabin precision ---------------------------------------
  const haveFlightPrecision = Boolean(leg.flightNumber || leg.aircraftType || rule.aircraftType);
  if (rule.aircraftVaries && !haveFlightPrecision) {
    reasons.push(reason("AIRCRAFT_DATA_MISSING", "warn"));
  }

  // ----- Pet comfort -------------------------------------------------------
  if (pet.heightCm != null || pet.lengthCm != null) {
    // Internal usable space is approximated as the carrier dimensions less a
    // small wall allowance; the pet should fit standing and lying.
    const interiorHeight = carrier.heightCm - 2;
    const interiorLength = carrier.lengthCm - 2;
    const tooTall = pet.heightCm != null && pet.heightCm > interiorHeight;
    const tooLong = pet.lengthCm != null && pet.lengthCm > interiorLength;
    if (tooTall || tooLong) {
      reasons.push(reason("PET_COMFORT_RISK", "warn"));
    }
  } else {
    reasons.push(reason("PET_COMFORT_UNCERTAIN", "info"));
  }

  // ----- Always-on caveat --------------------------------------------------
  reasons.push(reason("FINAL_APPROVAL_AIRLINE_DISCRETION", "info"));

  // ----- Confidence band ---------------------------------------------------
  // Reflects data quality, never optimism. "low" when we can't really judge
  // fit (no dimensions, unknown operating airline, very stale source); "medium"
  // when a softer signal is missing (no weight limit, aircraft variance, an
  // economy fallback, or an aging/unverified source).
  const fresh = freshness(rule.lastVerifiedAt).band;

  if (!haveAllMax) {
    confidenceReasons.push("This airline doesn't publish carrier dimensions, so the size check is limited.");
  }
  if (rule.maxCombinedWeightKg == null) {
    confidenceReasons.push("This airline doesn't publish a combined pet + carrier weight limit.");
  }
  if (rule.aircraftVaries && !haveFlightPrecision) {
    confidenceReasons.push("Under-seat space varies by aircraft and no flight number was provided.");
  }
  if (!cabinModeled) {
    confidenceReasons.push("This cabin isn't separately modeled, so the economy rule was used as a conservative stand-in.");
  }
  if (fresh === "unknown") {
    confidenceReasons.push("This rule has no verification date on file.");
  } else if (fresh === "stale") {
    confidenceReasons.push("This rule hasn't been re-verified in a long time and may be out of date.");
  } else if (fresh === "aging") {
    confidenceReasons.push("This rule was last verified several months ago.");
  }

  let confidence: ConfidenceBand = "high";
  if (!haveAllMax || operatingUnknown || fresh === "stale") {
    confidence = "low";
  } else if (
    rule.maxCombinedWeightKg == null ||
    (rule.aircraftVaries && !haveFlightPrecision) ||
    !cabinModeled ||
    fresh === "aging" ||
    fresh === "unknown"
  ) {
    confidence = "medium";
  }

  return {
    legIndex,
    airlineId: airline.id,
    airlineName: airline.name,
    ...legFlags,
    origin: leg.origin,
    destination: leg.destination,
    cabin: leg.cabin,
    verdict: verdictFromReasons(reasons),
    confidence,
    confidenceReasons,
    reasons,
    ruleSnapshot,
    comparison,
  };
}

function overallVerdict(legs: LegResult[]): Verdict {
  if (legs.some((l) => l.verdict === "NO")) return "NO";
  if (legs.some((l) => l.verdict === "BORDERLINE")) return "BORDERLINE";
  return "PASS";
}

function overallConfidence(legs: LegResult[]): ConfidenceBand {
  if (legs.some((l) => l.confidence === "low")) return "low";
  if (legs.some((l) => l.confidence === "medium")) return "medium";
  return "high";
}

export interface LegContext {
  leg: TripLegInput;
  // Airline used for evaluation (operating carrier when overridden).
  airline: Airline;
  rule: AirlineRule | null;
  meta?: LegMeta;
}

export function evaluateTrip(
  carrier: Carrier,
  pet: Pet,
  legs: LegContext[],
): TripResult {
  const legResults = legs.map((ctx, i) =>
    evaluateLeg(carrier, pet, ctx.leg, ctx.airline, ctx.rule, i, ctx.meta),
  );
  const confidenceReasons = [...new Set(legResults.flatMap((l) => l.confidenceReasons))];
  return {
    overall: overallVerdict(legResults),
    confidence: overallConfidence(legResults),
    confidenceReasons,
    legs: legResults,
  };
}
