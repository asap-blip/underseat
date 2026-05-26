import { describe, expect, it } from "vitest";
import { evaluateLeg, evaluateTrip, type LegContext } from "@/lib/rules/engine";
import type { Airline, AirlineRule, Carrier, Pet, TripLegInput } from "@/lib/data/types";

const airline: Airline = { id: "test-air", name: "Test Air", iata: "TA", country: "US" };

function rule(overrides: Partial<AirlineRule> = {}): AirlineRule {
  return {
    id: "r1",
    airlineId: "test-air",
    cabin: "economy",
    aircraftType: null,
    maxLengthCm: 45,
    maxWidthCm: 28,
    maxHeightCm: 24,
    maxCombinedWeightKg: 9,
    softSidedRequirement: "recommended",
    aircraftVaries: false,
    notes: null,
    sourceUrl: "https://example.com/rules",
    lastVerifiedAt: "2026-01-01",
    ...overrides,
  };
}

function carrier(overrides: Partial<Carrier> = {}): Carrier {
  return {
    id: "c1",
    brand: "Test",
    model: "Bag",
    sku: "T-1",
    softSided: true,
    lengthCm: 43,
    widthCm: 27,
    heightCm: 23,
    weightKg: 1,
    verification: "verified",
    ...overrides,
  };
}

const pet: Pet = { species: "dog", weightKg: 4 };
const leg: TripLegInput = { airlineId: "test-air", origin: "AAA", destination: "BBB", cabin: "economy" };

function ctx(c: Carrier, r: AirlineRule | null): LegContext {
  return { leg, airline, rule: r };
}

describe("evaluateLeg", () => {
  it("returns PASS when the carrier fits all dimensions and weight", () => {
    const res = evaluateLeg(carrier(), pet, leg, airline, rule(), 0);
    expect(res.verdict).toBe("PASS");
    expect(res.reasons.some((r) => r.code === "FITS_ALL_DIMENSIONS")).toBe(true);
  });

  it("returns NO when a hard-sided carrier clearly exceeds a dimension", () => {
    const res = evaluateLeg(
      carrier({ softSided: false, heightCm: 40 }),
      pet,
      leg,
      airline,
      rule(),
      0,
    );
    expect(res.verdict).toBe("NO");
    // Sorted comparison: 43,40,27 vs 45,28,24 -> second slot (width code) over.
    expect(res.reasons.some((r) => r.severity === "fail")).toBe(true);
  });

  it("returns BORDERLINE when a soft-sided carrier is just over by < margin", () => {
    const res = evaluateLeg(
      carrier({ heightCm: 25.5 }), // 1.5cm over 24, within soft 2.5cm margin
      pet,
      leg,
      airline,
      rule(),
      0,
    );
    expect(res.verdict).toBe("BORDERLINE");
  });

  it("fails when soft-sided is required but carrier is hard-sided", () => {
    const res = evaluateLeg(
      carrier({ softSided: false }),
      pet,
      leg,
      airline,
      rule({ softSidedRequirement: "required" }),
      0,
    );
    expect(res.verdict).toBe("NO");
    expect(res.reasons.some((r) => r.code === "SOFT_SIDED_REQUIRED")).toBe(true);
  });

  it("flags weight when combined pet + carrier exceeds the limit", () => {
    const res = evaluateLeg(
      carrier({ weightKg: 3 }),
      { species: "dog", weightKg: 8 }, // 11 vs 9 limit
      leg,
      airline,
      rule(),
      0,
    );
    expect(res.verdict).toBe("NO");
    expect(res.reasons.some((r) => r.code === "WEIGHT_LIMIT_EXCEEDED")).toBe(true);
  });

  it("is BORDERLINE with low confidence when no rule exists", () => {
    const res = evaluateLeg(carrier(), pet, leg, airline, null, 0);
    expect(res.verdict).toBe("BORDERLINE");
    expect(res.confidence).toBe("low");
    expect(res.reasons.some((r) => r.code === "INCOMPLETE_RULE_DATA")).toBe(true);
  });

  it("warns about missing aircraft data only when the rule varies and no flight is given", () => {
    const varying = rule({ aircraftVaries: true });
    const withoutFlight = evaluateLeg(carrier(), pet, leg, airline, varying, 0);
    expect(withoutFlight.reasons.some((r) => r.code === "AIRCRAFT_DATA_MISSING")).toBe(true);

    const withFlight = evaluateLeg(
      carrier(),
      pet,
      { ...leg, flightNumber: "TA123" },
      airline,
      varying,
      0,
    );
    expect(withFlight.reasons.some((r) => r.code === "AIRCRAFT_DATA_MISSING")).toBe(false);
  });

  it("adds PET_COMFORT_UNCERTAIN when no measurements are given and risk when too big", () => {
    const uncertain = evaluateLeg(carrier(), pet, leg, airline, rule(), 0);
    expect(uncertain.reasons.some((r) => r.code === "PET_COMFORT_UNCERTAIN")).toBe(true);

    const risky = evaluateLeg(
      carrier({ heightCm: 23 }),
      { species: "dog", weightKg: 4, heightCm: 30 },
      leg,
      airline,
      rule(),
      0,
    );
    expect(risky.reasons.some((r) => r.code === "PET_COMFORT_RISK")).toBe(true);
    expect(risky.verdict).toBe("BORDERLINE");
  });

  it("is high confidence with no reasons when the rule is complete and freshly verified", () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = evaluateLeg(carrier(), pet, leg, airline, rule({ lastVerifiedAt: today }), 0);
    expect(res.confidence).toBe("high");
    expect(res.confidenceReasons).toHaveLength(0);
  });

  it("explains reduced confidence for a stale source", () => {
    const res = evaluateLeg(carrier(), pet, leg, airline, rule({ lastVerifiedAt: "2024-01-01" }), 0);
    expect(res.confidence).toBe("low");
    expect(res.confidenceReasons.some((m) => /re-verified/i.test(m))).toBe(true);
  });

  it("always includes the airline-discretion caveat", () => {
    const res = evaluateLeg(carrier(), pet, leg, airline, rule(), 0);
    expect(res.reasons.some((r) => r.code === "FINAL_APPROVAL_AIRLINE_DISCRETION")).toBe(true);
  });

  it("is orientation-independent (sorted dimension comparison)", () => {
    // Same box, axes permuted -> same verdict.
    const a = evaluateLeg(carrier({ lengthCm: 43, widthCm: 27, heightCm: 23 }), pet, leg, airline, rule(), 0);
    const b = evaluateLeg(carrier({ lengthCm: 23, widthCm: 43, heightCm: 27 }), pet, leg, airline, rule(), 0);
    expect(a.verdict).toBe(b.verdict);
  });
});

describe("evaluateTrip", () => {
  it("overall is NO if any leg is NO", () => {
    const good = ctx(carrier(), rule());
    const bad: LegContext = { leg, airline, rule: rule({ maxHeightCm: 10 }) };
    const res = evaluateTrip(carrier({ softSided: false }), pet, [good, bad]);
    expect(res.overall).toBe("NO");
  });

  it("overall is BORDERLINE if a leg is borderline and none are NO", () => {
    const good = ctx(carrier(), rule());
    const borderline: LegContext = { leg, airline, rule: null };
    const res = evaluateTrip(carrier(), pet, [good, borderline]);
    expect(res.overall).toBe("BORDERLINE");
  });

  it("overall is PASS only when all legs pass", () => {
    const res = evaluateTrip(carrier(), pet, [ctx(carrier(), rule()), ctx(carrier(), rule())]);
    expect(res.overall).toBe("PASS");
  });
});
