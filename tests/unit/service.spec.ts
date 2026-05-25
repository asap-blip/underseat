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
