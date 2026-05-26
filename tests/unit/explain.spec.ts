import { describe, expect, it } from "vitest";
import { groupReasons, verdictSummary } from "@/lib/explain";
import type { Reason } from "@/lib/rules/reasonCodes";

const r = (code: Reason["code"], severity: Reason["severity"]): Reason => ({
  code,
  severity,
  message: code,
});

describe("explain", () => {
  it("gives a plain-language summary per verdict", () => {
    expect(verdictSummary("PASS")).toMatch(/fits/i);
    expect(verdictSummary("BORDERLINE")).toMatch(/either way/i);
    expect(verdictSummary("NO")).toMatch(/no/i);
  });

  it("groups reasons into the right categories and order", () => {
    const groups = groupReasons([
      r("DIMENSION_HEIGHT_EXCEEDED", "fail"),
      r("CABIN_NOT_MODELED", "info"),
      r("INCOMPLETE_RULE_DATA", "warn"),
      r("FINAL_APPROVAL_AIRLINE_DISCRETION", "info"),
      r("FITS_ALL_DIMENSIONS", "pass"),
    ]);
    const cats = groups.map((g) => g.category);
    expect(cats).toEqual(["blocker", "fallback", "incomplete", "pass", "advisory"]);
  });
});
