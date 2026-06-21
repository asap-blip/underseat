import type { Carrier } from "@/lib/data/types";
import { freshness, type FreshnessBand } from "@/lib/freshness";

// ─── Item config ──────────────────────────────────────────────────────────

interface ChecklistItem {
  icon: string;
  label: string;
  color: string;
}

function rulesItem(verification: Carrier["verification"]): ChecklistItem {
  switch (verification) {
    case "team_verified":
      return { icon: "✅", label: "Rules checked", color: "text-green-600" };
    case "traveler_reported":
      return { icon: "✅", label: "Rules checked", color: "text-green-600" };
    case "needs_review":
      return { icon: "❌", label: "Needs review", color: "text-red-500" };
    case "failed_check":
      return { icon: "❌", label: "Failed check", color: "text-red-500" };
    case "not_verified_yet":
    default:
      return { icon: "⏳", label: "Awaiting review", color: "text-amber-500" };
  }
}

function travelerItem(travelerReports: number | null | undefined): ChecklistItem {
  if (travelerReports && travelerReports > 0) {
    return {
      icon: "✅",
      label: `${travelerReports} traveler${travelerReports === 1 ? "" : "s"} confirmed`,
      color: "text-green-600",
    };
  }
  return { icon: "⏳", label: "No reports yet", color: "text-amber-500" };
}

function freshnessItem(verifiedAt: string | null | undefined): ChecklistItem {
  const band = verifiedAt ? freshness(verifiedAt).band : ("unknown" as FreshnessBand);
  switch (band) {
    case "fresh":
      return { icon: "✅", label: "Fresh data", color: "text-green-600" };
    case "aging":
      return { icon: "🔄", label: "Aging data", color: "text-orange-500" };
    case "stale":
    case "unknown":
    default:
      return { icon: "⏳", label: "Stale data", color: "text-amber-500" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────

const lineCls = "flex items-center gap-1.5 text-[11px] leading-tight";

export function TrustChecklist({ carrier }: { carrier: Carrier }) {
  const rules = rulesItem(carrier.verification);
  const traveler = travelerItem(carrier.travelerReports);
  const fresh = freshnessItem(carrier.verifiedAt);

  return (
    <ul className="flex flex-col gap-1" aria-label="Carrier trust checklist">
      <li className={lineCls}>
        <span className="shrink-0 text-[13px]" aria-hidden="true">{rules.icon}</span>
        <span className={rules.color}>{rules.label}</span>
      </li>
      <li className={lineCls}>
        <span className="shrink-0 text-[13px]" aria-hidden="true">{traveler.icon}</span>
        <span className={traveler.color}>{traveler.label}</span>
      </li>
      <li className={lineCls}>
        <span className="shrink-0 text-[13px]" aria-hidden="true">{fresh.icon}</span>
        <span className={fresh.color}>{fresh.label}</span>
      </li>
    </ul>
  );
}