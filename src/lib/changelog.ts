import type { AirlineRule } from "@/lib/data/types";

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  summary: string;
}

// Lightweight, hand-maintained feed of rule/coverage updates. Keep it short and
// honest — it exists to show the data is actively maintained, not for marketing.
export const CHANGELOG: ChangelogEntry[] = [
  { date: "2026-05-26", summary: "Re-verified all 8 airlines against current public policy (May 2026). Corrected Air Canada and Lufthansa to soft-sided-required, and JetBlue to allow hard-sided (soft preferred). Sources cross-checked against current guides; airlines' own pages couldn't be fetched directly (bot-protected), so values reflect current published policy as cited by those sources." },
  { date: "2026-05-26", summary: "Fixed United/Alaska hard-carrier notes, clarified American soft vs hard limits, and documented Southwest's 8.5/9.5 in height ambiguity (using the conservative figure)." },
  { date: "2026-01-15", summary: "Verified Air Canada and Lufthansa in-cabin limits against their official policy pages." },
  { date: "2026-01-12", summary: "Added United and Delta; flagged Delta as having no fixed published dimensions." },
  { date: "2026-01-09", summary: "Added American, Southwest, JetBlue and Alaska economy rules with source links." },
  { date: "2026-01-14", summary: "Added a Lufthansa business-cabin rule (separate from economy)." },
];

// Most recent verification date across all rules — shown as "rules last updated".
export function rulesLastUpdated(rules: AirlineRule[]): string | null {
  const dates = rules.map((r) => r.lastVerifiedAt).filter((d): d is string => Boolean(d));
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}
