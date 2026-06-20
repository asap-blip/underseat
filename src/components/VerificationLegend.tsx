import { HelpPanel } from "./Help";
import { CARRIER_STATUS, PRIMARY_STATUSES, STATUS_TONE_CLASS } from "@/lib/carrierStatus";

// Lightweight, collapsed-by-default explainer shown above the carrier grid.
export function VerificationLegend() {
  return (
    <HelpPanel title="How verification works">
      <div className="grid gap-3 sm:grid-cols-3">
        {PRIMARY_STATUSES.map((status) => {
          const c = CARRIER_STATUS[status];
          return (
            <div key={status} className="rounded-2xl border border-slate-200 bg-white/90 p-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONE_CLASS[c.tone]}`}
              >
                {c.label}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{c.description}</p>
            </div>
          );
        })}
      </div>
    </HelpPanel>
  );
}
