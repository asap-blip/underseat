import type { Verdict } from "@/lib/rules/engine";
import { verdictStyles } from "@/lib/ui";

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const s = verdictStyles[verdict];
  const sizing =
    size === "lg"
      ? "px-4 py-1.5 text-base"
      : size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${s.bg} ${s.text} ${s.ring} ${sizing}`}>
      {s.label}
    </span>
  );
}
