import { describe, expect, it } from "vitest";
import { recommendCarriers } from "@/lib/recommend";
import type { Carrier } from "@/lib/data/types";

function carrier(over: Partial<Carrier> & { id: string }): Carrier {
  return {
    brand: "Test",
    model: over.id,
    sku: over.id,
    softSided: true,
    lengthCm: 45,
    widthCm: 28,
    heightCm: 28,
    weightKg: 1,
    maxPetWeightKg: 8,
    verification: "team_verified",
    ...over,
  };
}

const small = carrier({ id: "small", lengthCm: 41, heightCm: 25, maxPetWeightKg: 4 });
const big = carrier({ id: "big", lengthCm: 55, heightCm: 35, maxPetWeightKg: 12 });

describe("recommendCarriers", () => {
  it("marks a carrier too short for the pet as unlikely", () => {
    const recs = recommendCarriers({ weightKg: 5, lengthCm: 50, heightCm: 30 }, [small, big]);
    const s = recs.find((r) => r.carrier.id === "small")!;
    expect(s.fit).toBe("unlikely");
    expect(s.lengthHeadroomCm).toBeLessThan(0);
  });

  it("marks a roomy, in-weight carrier as a good fit", () => {
    const recs = recommendCarriers({ weightKg: 5, lengthCm: 40, heightCm: 24 }, [big]);
    expect(recs[0].fit).toBe("good");
    expect(recs[0].weightOk).toBe(true);
  });

  it("flags over-weight pets as unlikely even if dimensions fit", () => {
    const recs = recommendCarriers({ weightKg: 10, lengthCm: 30, heightCm: 20 }, [small]);
    expect(recs[0].fit).toBe("unlikely");
    expect(recs[0].weightOk).toBe(false);
  });

  it("orders good fits before snug before unlikely", () => {
    const recs = recommendCarriers({ weightKg: 5, lengthCm: 44, heightCm: 27 }, [small, big]);
    const fits = recs.map((r) => r.fit);
    // big should be a better fit than small for a larger pet
    expect(recs[0].carrier.id).toBe("big");
    expect(fits.indexOf("unlikely")).toBeGreaterThan(0);
  });

  it("works on weight alone and says so", () => {
    const recs = recommendCarriers({ weightKg: 3 }, [small]);
    expect(recs[0].measurementsUsed).toBe(false);
    expect(recs[0].reasons.some((r) => /weight only/i.test(r))).toBe(true);
  });
});
