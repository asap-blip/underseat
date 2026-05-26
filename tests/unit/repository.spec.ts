import { describe, expect, it } from "vitest";
import { getRepository } from "@/lib/data/repository";

describe("repository updateRule (static)", () => {
  it("patches an existing rule and reflects it on read", async () => {
    const repo = getRepository();
    const before = await repo.getRuleById("air-canada-economy");
    expect(before).not.toBeNull();

    const updated = await repo.updateRule("air-canada-economy", {
      maxHeightCm: 30,
      lastVerifiedAt: "2026-05-25",
      sourceType: "airline_pdf",
    });
    expect(updated?.maxHeightCm).toBe(30);
    expect(updated?.lastVerifiedAt).toBe("2026-05-25");
    expect(updated?.sourceType).toBe("airline_pdf");

    const reread = await repo.getRuleById("air-canada-economy");
    expect(reread?.maxHeightCm).toBe(30);

    // restore so other tests are unaffected
    await repo.updateRule("air-canada-economy", {
      maxHeightCm: 27,
      lastVerifiedAt: "2026-01-15",
      sourceType: "airline_official",
    });
  });

  it("returns null for an unknown rule id", async () => {
    expect(await getRepository().updateRule("nope", { notes: "x" })).toBeNull();
  });

  it("patches an existing carrier and reflects it on read", async () => {
    const repo = getRepository();
    const updated = await repo.updateCarrier("frisco-soft", {
      heightCm: 26,
      verification: "team_verified",
      verifiedAt: "2026-05-25",
    });
    expect(updated?.heightCm).toBe(26);
    expect(updated?.verification).toBe("team_verified");

    const reread = await repo.getCarrier("frisco-soft");
    expect(reread?.heightCm).toBe(26);
    expect(reread?.verifiedAt).toBe("2026-05-25");

    // restore
    await repo.updateCarrier("frisco-soft", { heightCm: 28, verification: "team_verified", verifiedAt: "2026-03-15" });
  });

  it("returns null for an unknown carrier id", async () => {
    expect(await getRepository().updateCarrier("nope", { heightCm: 10 })).toBeNull();
  });

  it("carries source fields through the rule snapshot list", async () => {
    const rules = await getRepository().listRules();
    const ac = rules.find((r) => r.id === "air-canada-economy");
    expect(ac?.sourceLabel).toContain("Air Canada");
    expect(ac?.sourceType).toBe("airline_official");
  });
});
