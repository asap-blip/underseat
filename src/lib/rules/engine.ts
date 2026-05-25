import type {
  Airline,
  AirlineRule,
  Carrier,
  Pet,
  TripLegInput,
} from "@/lib/data/types";
import type { Reason, ReasonSeverity } from "./reasonCodes";
import { REASON_LABELS } from "./reasonCodes";

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
  lastVerifiedAt: string | null;
}

export interface LegResult {
  legIndex: number;
  airlineId: string;
  airlineName: string;
  origin: string;
  destination: string;
  cabin: string;
  verdict: Verdict;
  confidence: ConfidenceBand;
  reasons: Reason[];
  ruleSnapshot: RuleSnapshot | null;
  // Per-dimension comparison for the results table (cm).
  comparison: DimensionComparison[];
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
): LegResult {
  const reasons: Reason[] = [];
  const comparison: DimensionComparison[] = [];

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
        lastVerifiedAt: rule.lastVerifiedAt ?? null,
      }
    : null;

  // ----- No rule on file at all -------------------------------------------
  if (!rule) {
    reasons.push(reason("INCOMPLETE_RULE_DATA", "warn"));
    reasons.push(reason("FINAL_APPROVAL_AIRLINE_DISCRETION", "info"));
    return {
      legIndex,
      airlineId: airline.id,
      airlineName: airline.name,
      origin: leg.origin,
      destination: leg.destination,
      cabin: leg.cabin,
      verdict: verdictFromReasons(reasons),
      confidence: "low",
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
  // Low only when we cannot judge fit at all (missing max dimensions).
  // Medium when dimensions exist but some signal is soft (no published weight,
  // aircraft variance without a flight, or an unverified rule).
  let confidence: ConfidenceBand = "high";
  if (!haveAllMax) {
    confidence = "low";
  } else if (
    rule.maxCombinedWeightKg == null ||
    (rule.aircraftVaries && !haveFlightPrecision) ||
    rule.lastVerifiedAt == null
  ) {
    confidence = "medium";
  }

  return {
    legIndex,
    airlineId: airline.id,
    airlineName: airline.name,
    origin: leg.origin,
    destination: leg.destination,
    cabin: leg.cabin,
    verdict: verdictFromReasons(reasons),
    confidence,
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
  airline: Airline;
  rule: AirlineRule | null;
}

export function evaluateTrip(
  carrier: Carrier,
  pet: Pet,
  legs: LegContext[],
): TripResult {
  const legResults = legs.map((ctx, i) =>
    evaluateLeg(carrier, pet, ctx.leg, ctx.airline, ctx.rule, i),
  );
  return {
    overall: overallVerdict(legResults),
    confidence: overallConfidence(legResults),
    legs: legResults,
  };
}
