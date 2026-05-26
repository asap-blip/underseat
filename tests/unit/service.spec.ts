import { describe, expect, it } from "vitest";
import { decodeCheck, encodeCheck, runCheck } from "@/lib/check/service";
import type { CheckInput } from "@/lib/data/types";

const baseLeg = { origin: "YYZ", destination: "LHR", cabin: "economy" as const };

describe("runCheck (static seed)", () => {
  it("passes a compliant soft carrier on a single Air Canada leg", async () => {
    const input: CheckInput = {
      carrierId: "sherpa-original-md", // 43x27x27 soft; AC allows 55x40x27
      pet: { species: "cat", weightKg: 4 },
      legs: [{ airlineId: "air-canada", ...baseLeg }],
    };
    const res = await runCheck(input);
    expect(res.result.overall).toBe("PASS");
    expect(res.carrier.brand).toBe("Sherpa");
  });

  it("fails an oversized hard cargo kennel and offers fitting alternatives", async () => {
    const input: CheckInput = {
      carrierId: "petmate-sky-100", // 53x38x38 hard
      pet: { species: "dog", weightKg: 6 },
      legs: [{ airlineId: "jetblue", ...baseLeg, destination: "BOS" }],
    };
    const res = await runCheck(input);
    expect(res.result.overall).toBe("NO");
    expect(res.alternatives.length).toBeGreaterThan(0);
    // Every suggested alternative must itself pass the trip.
    expect(res.alternatives.every((a) => a.verdict === "PASS")).toBe(true);
  });

  it("derives an overall BORDERLINE/NO across a multi-leg itinerary", async () => {
    const input: CheckInput = {
      carrierId: "elitefield-3door-lg", // 51x33x33 soft, oversized for tight cabins
      pet: { species: "dog", weightKg: 5 },
      legs: [
        { airlineId: "air-canada", origin: "YYZ", destination: "FRA", cabin: "economy" },
        { airlineId: "jetblue", origin: "FRA", destination: "BOS", cabin: "economy" },
      ],
    };
    const res = await runCheck(input);
    expect(res.result.legs).toHaveLength(2);
    expect(["BORDERLINE", "NO"]).toContain(res.result.overall);
  });

  it("uses the operating carrier's rule and flags override + codeshare", async () => {
    const input: CheckInput = {
      carrierId: "petmate-sky-100", // oversized hard kennel, fails JetBlue
      pet: { species: "dog", weightKg: 6 },
      legs: [
        {
          airlineId: "air-canada", // booked on AC
          operatingCarrierId: "jetblue", // actually flown by B6
          origin: "YYZ",
          destination: "BOS",
          cabin: "economy",
        },
      ],
    };
    const res = await runCheck(input);
    const leg = res.result.legs[0];
    expect(leg.airlineId).toBe("jetblue"); // evaluated against operating carrier
    expect(leg.bookingAirlineId).toBe("air-canada");
    expect(leg.operatingOverride).toBe(true);
    expect(leg.codeshare).toBe(true);
    expect(leg.reasons.some((r) => r.code === "OPERATING_CARRIER_USED")).toBe(true);
    expect(leg.reasons.some((r) => r.code === "CODESHARE_PARTNER_OPERATED")).toBe(true);
    expect(res.warnings.some((w) => w.code === "CODESHARE_PRESENT")).toBe(true);
  });

  it("warns when an itinerary uses more than one airline", async () => {
    const input: CheckInput = {
      carrierId: "sherpa-original-md",
      pet: { species: "cat", weightKg: 4 },
      legs: [
        { airlineId: "air-canada", origin: "YYZ", destination: "FRA", cabin: "economy" },
        { airlineId: "lufthansa", origin: "FRA", destination: "MUC", cabin: "economy" },
      ],
    };
    const res = await runCheck(input);
    expect(res.warnings.some((w) => w.code === "MULTI_AIRLINE_ITINERARY")).toBe(true);
  });

  it("flags an unmodeled cabin and falls back to economy explicitly", async () => {
    const input: CheckInput = {
      carrierId: "sherpa-original-md",
      pet: { species: "cat", weightKg: 4 },
      // United only models economy; business should fall back + be flagged.
      legs: [{ airlineId: "united", origin: "EWR", destination: "SFO", cabin: "business" }],
    };
    const res = await runCheck(input);
    const leg = res.result.legs[0];
    expect(leg.cabinModeled).toBe(false);
    expect(leg.ruleSnapshot?.cabin).toBe("economy");
    expect(leg.reasons.some((r) => r.code === "CABIN_NOT_MODELED")).toBe(true);
  });

  it("treats Lufthansa business as a modeled cabin (no fallback)", async () => {
    const input: CheckInput = {
      carrierId: "sherpa-original-md",
      pet: { species: "cat", weightKg: 4 },
      legs: [{ airlineId: "lufthansa", origin: "FRA", destination: "JFK", cabin: "business" }],
    };
    const res = await runCheck(input);
    const leg = res.result.legs[0];
    expect(leg.cabinModeled).toBe(true);
    expect(leg.ruleSnapshot?.cabin).toBe("business");
    expect(leg.reasons.some((r) => r.code === "CABIN_NOT_MODELED")).toBe(false);
  });

  it("caps an unknown operating carrier at BORDERLINE with low confidence", async () => {
    const input: CheckInput = {
      // A carrier that would otherwise PASS on Air Canada economy.
      carrierId: "sherpa-original-md",
      pet: { species: "cat", weightKg: 4 },
      legs: [
        {
          airlineId: "air-canada",
          operatingCarrierUnknown: true,
          origin: "YYZ",
          destination: "YVR",
          cabin: "economy",
        },
      ],
    };
    const res = await runCheck(input);
    const leg = res.result.legs[0];
    expect(leg.operatingUnknown).toBe(true);
    expect(leg.operatingOverride).toBe(false); // no modeled substitute used
    expect(leg.airlineId).toBe("air-canada"); // evaluated against the ticket carrier
    expect(leg.confidence).toBe("low");
    expect(leg.verdict).toBe("BORDERLINE"); // would be PASS, downgraded
    expect(leg.reasons.some((r) => r.code === "OPERATING_CARRIER_UNKNOWN")).toBe(true);
    expect(res.warnings.some((w) => w.code === "OPERATING_CARRIER_UNKNOWN")).toBe(true);
  });

  it("does not let an unknown operating carrier rescue a hard NO", async () => {
    const input: CheckInput = {
      carrierId: "petmate-sky-100", // oversized hard kennel
      pet: { species: "dog", weightKg: 6 },
      legs: [
        { airlineId: "jetblue", operatingCarrierUnknown: true, origin: "JFK", destination: "BOS", cabin: "economy" },
      ],
    };
    const res = await runCheck(input);
    expect(res.result.legs[0].verdict).toBe("NO");
  });

  it("throws on an unknown carrier", async () => {
    await expect(
      runCheck({ carrierId: "does-not-exist", pet: { species: "dog", weightKg: 5 }, legs: [{ airlineId: "delta", ...baseLeg }] }),
    ).rejects.toThrow();
  });
});

describe("share encoding", () => {
  it("round-trips a check input", () => {
    const input: CheckInput = {
      carrierId: "sturdibag-large",
      pet: { species: "dog", weightKg: 6, heightCm: 25 },
      legs: [{ airlineId: "united", ...baseLeg, flightNumber: "UA1" }],
    };
    const token = encodeCheck(input);
    expect(decodeCheck(token)).toEqual(input);
  });

  it("returns null for a malformed token", () => {
    expect(decodeCheck("!!!not-base64!!!")).toBeNull();
  });
});
