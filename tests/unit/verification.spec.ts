import { describe, expect, it } from "vitest";
import {
  confidenceFromTally,
  deriveTravelerStatus,
  isTeamControlled,
  tallyReports,
} from "@/lib/verification";

describe("tallyReports", () => {
  it("counts positives/negatives and totals (unsure counts only toward total)", () => {
    const t = tallyReports([
      { outcome: "accepted" },
      { outcome: "accepted" },
      { outcome: "denied" },
      { outcome: "unsure" },
    ]);
    expect(t).toEqual({ total: 4, positive: 2, negative: 1 });
  });
});

describe("confidenceFromTally", () => {
  it("is 0 with no decisive reports", () => {
    expect(confidenceFromTally({ total: 0, positive: 0, negative: 0 })).toBe(0);
    expect(confidenceFromTally({ total: 3, positive: 0, negative: 0 })).toBe(0);
  });
  it("stays conservative for a single positive", () => {
    expect(confidenceFromTally({ total: 1, positive: 1, negative: 0 })).toBeCloseTo(0.333, 3);
  });
  it("climbs with agreement and volume", () => {
    const few = confidenceFromTally({ total: 3, positive: 3, negative: 0 });
    const many = confidenceFromTally({ total: 10, positive: 10, negative: 0 });
    expect(many).toBeGreaterThan(few);
    expect(many).toBeLessThanOrEqual(1);
  });
  it("drops when negatives are present", () => {
    expect(confidenceFromTally({ total: 4, positive: 2, negative: 2 })).toBeLessThan(
      confidenceFromTally({ total: 4, positive: 4, negative: 0 }),
    );
  });
});

describe("deriveTravelerStatus", () => {
  it("not_verified_yet when there are no reports", () => {
    expect(deriveTravelerStatus({ total: 0, positive: 0, negative: 0 })).toBe("not_verified_yet");
  });
  it("traveler_reported when positives lead", () => {
    expect(deriveTravelerStatus({ total: 3, positive: 3, negative: 0 })).toBe("traveler_reported");
    expect(deriveTravelerStatus({ total: 4, positive: 3, negative: 1 })).toBe("traveler_reported");
  });
  it("needs_review for negative-only or conflicting signal", () => {
    expect(deriveTravelerStatus({ total: 2, positive: 0, negative: 2 })).toBe("needs_review");
    expect(deriveTravelerStatus({ total: 2, positive: 1, negative: 1 })).toBe("needs_review");
  });
  it("never auto-emits team_verified or failed_check", () => {
    for (const t of [
      { total: 50, positive: 50, negative: 0 },
      { total: 50, positive: 0, negative: 50 },
    ]) {
      const s = deriveTravelerStatus(t);
      expect(s).not.toBe("team_verified");
      expect(s).not.toBe("failed_check");
    }
  });
});

describe("isTeamControlled", () => {
  it("protects team/automated/manual verdicts from crowd override", () => {
    expect(isTeamControlled("team_check")).toBe(true);
    expect(isTeamControlled("automated_rule_match")).toBe(true);
    expect(isTeamControlled("manual_review")).toBe(true);
    expect(isTeamControlled("traveler_reports")).toBe(false);
    expect(isTeamControlled(null)).toBe(false);
  });
});
