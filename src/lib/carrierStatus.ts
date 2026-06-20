import type { Carrier, CarrierStatus, CarrierVerification } from "@/lib/data/types";

export type StatusTone = "success" | "info" | "neutral" | "warn";

export interface CarrierStatusConfig {
  label: string;
  tone: StatusTone;
  description: string;
}

// Single source of truth mapping a backend carrier status to its plain-English
// label, tone, and meaning. Extend here to add new states. The UI follows.
export const CARRIER_STATUS: Record<CarrierStatus, CarrierStatusConfig> = {
  team_verified: {
    label: "Checked by us",
    tone: "success",
    description:
      "Underseat manually reviewed this carrier model and size against the airline’s published in-cabin pet rules. This is not airline approval.",
  },
  traveler_reported: {
    label: "Traveler reported",
    tone: "info",
    description:
      "Travelers reported this carrier worked on this airline. Reports are reviewed, but not independently verified by Underseat.",
  },
  not_verified_yet: {
    label: "Needs review",
    tone: "neutral",
    description: "We do not have enough current data for this carrier-airline combo yet.",
  },
  failed_check: {
    label: "Doesn’t match airline rules",
    tone: "warn",
    description: "This carrier does not currently match the airline rule data we have on file.",
  },
  needs_review: {
    label: "Needs review",
    tone: "neutral",
    description: "This carrier-airline combo needs manual review before we can label it.",
  },
};

// Muted, premium-feeling tones. One success, one info/community, one neutral,
// plus a soft warn. Deliberately low-saturation.
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  warn: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function carrierStatusConfig(status: CarrierStatus): CarrierStatusConfig {
  return CARRIER_STATUS[status] ?? CARRIER_STATUS.not_verified_yet;
}

// Secondary evidence line shown beneath the primary badge.
export function carrierEvidence(carrier: Carrier): string {
  switch (carrier.verification) {
    case "team_verified":
      return "Manual review by us";
    case "traveler_reported": {
      const n = carrier.travelerReports ?? 0;
      return n > 0 ? `${n} traveler report${n === 1 ? "" : "s"}` : "Reports reviewed";
    }
    case "failed_check":
      return "Doesn’t match airline rules";
    case "needs_review":
      return "Awaiting manual review";
    case "not_verified_yet":
    default:
      return "Awaiting review";
  }
}

// Secondary evidence line for a per-(carrier, airline) verification record.
export function verificationEvidence(v: CarrierVerification): string {
  switch (v.status) {
    case "team_verified":
      return "Checked by us";
    case "traveler_reported":
      return v.travelerReportCount > 0
        ? `${v.travelerReportCount} traveler report${v.travelerReportCount === 1 ? "" : "s"}`
        : "Reports reviewed";
    case "failed_check":
      return v.explanation ?? "Doesn’t match airline rules";
    case "needs_review":
      return "Awaiting manual review";
    case "not_verified_yet":
    default:
      return "Awaiting review";
  }
}

// The three primary states explained in the "How verification works" legend.
export const PRIMARY_STATUSES: CarrierStatus[] = [
  "team_verified",
  "traveler_reported",
  "not_verified_yet",
];
