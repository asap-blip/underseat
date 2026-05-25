import type { Reason } from "@/lib/rules/reasonCodes";

const dot: Record<Reason["severity"], string> = {
  pass: "bg-emerald-500",
  info: "bg-slate-400",
  warn: "bg-amber-500",
  fail: "bg-rose-500",
};

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="space-y-2">
      {reasons.map((r, i) => (
        <li key={`${r.code}-${i}`} className="flex items-start gap-2 text-sm">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[r.severity]}`} />
          <span className="text-slate-700">
            {r.message}
            <span className="ml-2 font-mono text-[10px] uppercase text-slate-400">{r.code}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
