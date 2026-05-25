import type { DimensionComparison } from "@/lib/rules/engine";
import { cmToIn } from "@/lib/ui";

const statusStyle: Record<DimensionComparison["status"], string> = {
  ok: "text-emerald-700",
  borderline: "text-amber-700",
  over: "text-rose-700",
  unknown: "text-slate-400",
};

const statusLabel: Record<DimensionComparison["status"], string> = {
  ok: "Fits",
  borderline: "At limit",
  over: "Over",
  unknown: "No rule",
};

export function DimensionTable({ rows }: { rows: DimensionComparison[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="py-2 font-medium">Dimension</th>
          <th className="py-2 font-medium">Carrier</th>
          <th className="py-2 font-medium">Airline max</th>
          <th className="py-2 font-medium text-right">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.dimension}>
            <td className="py-2 capitalize text-slate-700">{r.dimension}</td>
            <td className="py-2 text-slate-900">
              {r.carrierValue} {r.unit}
              {r.unit === "cm" && <span className="text-slate-400"> ({cmToIn(r.carrierValue)} in)</span>}
            </td>
            <td className="py-2 text-slate-900">
              {r.ruleMax == null ? (
                <span className="text-slate-400">—</span>
              ) : (
                <>
                  {r.ruleMax} {r.unit}
                  {r.unit === "cm" && <span className="text-slate-400"> ({cmToIn(r.ruleMax)} in)</span>}
                </>
              )}
            </td>
            <td className={`py-2 text-right font-medium ${statusStyle[r.status]}`}>
              {statusLabel[r.status]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
