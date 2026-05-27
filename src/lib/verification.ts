import type { CarrierStatus, ReportOutcome, VerificationMethod } from "@/lib/data/types";

export interface ReportTally {
  total: number;
  positive: number;
  negative: number;
}

export function tallyReports(reports: { outcome: ReportOutcome }[]): ReportTally {
  let positive = 0;
  let negative = 0;
  for (const r of reports) {
    if (r.outcome === "accepted") positive += 1;
    else if (r.outcome === "denied") negative += 1;
    // "unsure" counts toward total only.
  }
  return { total: reports.length, positive, negative };
}

// Conservative confidence in [0,1]. Needs both agreement AND volume to climb:
// a single positive report yields ~0.33, not 1.0.
export function confidenceFromTally(t: ReportTally): number {
  const decisive = t.positive + t.negative;
  if (decisive === 0) return 0;
  const ratio = t.positive / decisive;
  const volumeFactor = decisive / (decisive + 2);
  return Number((ratio * volumeFactor).toFixed(3));
}

// Trust-first status derived purely from approved traveler reports. Never
// emits team_verified or failed_check (those are team/rule verdicts); negative
// or conflicting crowd signal routes to needs_review rather than auto-failing.
export function deriveTravelerStatus(t: ReportTally): CarrierStatus {
  if (t.total === 0) return "not_verified_yet";
  if (t.positive === 0 && t.negative > 0) return "needs_review";
  if (t.negative >= t.positive && t.total >= 2) return "needs_review";
  if (t.positive > 0 && t.positive >= t.negative) return "traveler_reported";
  return "needs_review";
}

// A verification controlled by a human/automated team check must not be
// overridden by crowd aggregation — we only refresh its counts.
export function isTeamControlled(method?: VerificationMethod | null): boolean {
  return method === "team_check" || method === "automated_rule_match" || method === "manual_review";
}

export function travelerExplanation(t: ReportTally): string {
  return `${t.positive} positive / ${t.negative} negative across ${t.total} approved traveler report${t.total === 1 ? "" : "s"}`;
}
