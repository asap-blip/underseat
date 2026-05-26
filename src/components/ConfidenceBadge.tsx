import type { ConfidenceBand } from "@/lib/rules/engine";

const styles: Record<ConfidenceBand, { label: string; cls: string }> = {
  high: { label: "High confidence", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  medium: { label: "Medium confidence", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  low: { label: "Low confidence", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceBand }) {
  const s = styles[confidence];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Plain-language explanation of why confidence is reduced.
export function ConfidenceReasons({
  confidence,
  reasons,
}: {
  confidence: ConfidenceBand;
  reasons: string[];
}) {
  if (confidence === "high" || reasons.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span className="font-medium text-slate-700">Why confidence is {confidence}: </span>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
