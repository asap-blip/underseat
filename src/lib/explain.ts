import type { Verdict } from "@/lib/rules/engine";
import type { Reason, ReasonCode } from "@/lib/rules/reasonCodes";

// Plain-language, one-line summary of a leg/trip verdict.
export function verdictSummary(verdict: Verdict, multiLeg = false): string {
  const scope = multiLeg ? "this itinerary" : "this leg";
  switch (verdict) {
    case "PASS":
      return `Looks good — this carrier fits the published rules for ${scope}.`;
    case "BORDERLINE":
      return `Could go either way for ${scope} — a few things below are worth double-checking before you fly.`;
    case "NO":
      return `Likely a no for ${scope} — at least one rule below isn't met.`;
  }
}

export type ReasonCategory = "blocker" | "close" | "fallback" | "incomplete" | "comfort" | "advisory" | "pass";

export interface ReasonGroup {
  category: ReasonCategory;
  label: string;
  reasons: Reason[];
}

const CATEGORY_OF: Record<ReasonCode, ReasonCategory> = {
  FITS_ALL_DIMENSIONS: "pass",
  DIMENSION_LENGTH_EXCEEDED: "blocker",
  DIMENSION_WIDTH_EXCEEDED: "blocker",
  DIMENSION_HEIGHT_EXCEEDED: "blocker",
  WEIGHT_LIMIT_EXCEEDED: "blocker",
  SOFT_SIDED_REQUIRED: "blocker",
  DIMENSION_LENGTH_BORDERLINE: "close",
  DIMENSION_WIDTH_BORDERLINE: "close",
  DIMENSION_HEIGHT_BORDERLINE: "close",
  WEIGHT_LIMIT_BORDERLINE: "close",
  SOFT_SIDED_RECOMMENDED: "close",
  CABIN_NOT_MODELED: "fallback",
  INCOMPLETE_RULE_DATA: "incomplete",
  AIRCRAFT_DATA_MISSING: "incomplete",
  OPERATING_CARRIER_UNKNOWN: "incomplete",
  PET_COMFORT_RISK: "comfort",
  PET_COMFORT_UNCERTAIN: "comfort",
  OPERATING_CARRIER_USED: "advisory",
  CODESHARE_PARTNER_OPERATED: "advisory",
  FINAL_APPROVAL_AIRLINE_DISCRETION: "advisory",
};

const CATEGORY_LABEL: Record<ReasonCategory, string> = {
  blocker: "What blocks it",
  close: "Close to the limit",
  fallback: "Conservative fallback",
  incomplete: "Incomplete data",
  comfort: "Pet comfort",
  advisory: "Good to know",
  pass: "What works",
};

const CATEGORY_ORDER: ReasonCategory[] = [
  "blocker",
  "close",
  "fallback",
  "incomplete",
  "comfort",
  "pass",
  "advisory",
];

export function groupReasons(reasons: Reason[]): ReasonGroup[] {
  const buckets = new Map<ReasonCategory, Reason[]>();
  for (const r of reasons) {
    const cat = CATEGORY_OF[r.code] ?? "advisory";
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(r);
  }
  return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    reasons: buckets.get(category)!,
  }));
}
