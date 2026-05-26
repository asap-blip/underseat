import type { Verdict } from "@/lib/rules/engine";
import type { Reason } from "@/lib/rules/reasonCodes";
import { groupReasons, verdictSummary, type ReasonCategory } from "@/lib/explain";

const groupDot: Record<ReasonCategory, string> = {
  blocker: "bg-rose-500",
  close: "bg-amber-500",
  fallback: "bg-amber-500",
  incomplete: "bg-slate-400",
  comfort: "bg-sky-500",
  advisory: "bg-slate-400",
  pass: "bg-emerald-500",
};

// Plain-language "Why this result" block. Reasons are grouped by category
// (what blocks it, close to the limit, conservative fallback, incomplete data,
// pet comfort, good to know) with the precise reason code kept secondary.
export function WhyResult({
  verdict,
  reasons,
  multiLeg = false,
}: {
  verdict: Verdict;
  reasons: Reason[];
  multiLeg?: boolean;
}) {
  const groups = groupReasons(reasons);
  return (
    <div>
      <p className="text-sm text-slate-700">{verdictSummary(verdict, multiLeg)}</p>
      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={g.category}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${groupDot[g.category]}`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.label}</span>
            </div>
            <ul className="mt-1 space-y-1 pl-4">
              {g.reasons.map((r, i) => (
                <li key={`${r.code}-${i}`} className="text-sm text-slate-700">
                  {r.message}
                  <span className="ml-2 font-mono text-[10px] uppercase text-slate-400">{r.code}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
