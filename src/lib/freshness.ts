// Verification freshness: how recently a rule or carrier record was confirmed.
// Used across the rules directory, catalog, and results to make staleness visible.

export type FreshnessBand = "fresh" | "aging" | "stale" | "unknown";

const AGING_AFTER_DAYS = 120;
const STALE_AFTER_DAYS = 270;

export interface Freshness {
  band: FreshnessBand;
  ageDays: number | null;
  label: string;
}

export function freshness(lastVerifiedAt?: string | null, now: Date = new Date()): Freshness {
  if (!lastVerifiedAt) {
    return { band: "unknown", ageDays: null, label: "Not verified" };
  }
  const verified = new Date(lastVerifiedAt);
  if (Number.isNaN(verified.getTime())) {
    return { band: "unknown", ageDays: null, label: "Not verified" };
  }
  const ageDays = Math.max(0, Math.floor((now.getTime() - verified.getTime()) / 86_400_000));
  if (ageDays > STALE_AFTER_DAYS) {
    return { band: "stale", ageDays, label: "Stale review" };
  }
  if (ageDays > AGING_AFTER_DAYS) {
    return { band: "aging", ageDays, label: "Aging review" };
  }
  return { band: "fresh", ageDays, label: "Fresh review" };
}

export const freshnessStyles: Record<FreshnessBand, string> = {
  fresh: "bg-emerald-50 text-emerald-700",
  aging: "bg-amber-50 text-amber-700",
  stale: "bg-rose-50 text-rose-700",
  unknown: "bg-slate-100 text-slate-500",
};
