import type { Verdict, ConfidenceBand } from "@/lib/rules/engine";

export const verdictStyles: Record<Verdict, { label: string; bg: string; text: string; ring: string }> = {
  PASS: { label: "PASS", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  BORDERLINE: { label: "BORDERLINE", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  NO: { label: "NO", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
};

export const confidenceLabel: Record<ConfidenceBand, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function cmToIn(cm: number): number {
  return Number((cm / 2.54).toFixed(1));
}

export function verdictHeadline(v: Verdict): string {
  switch (v) {
    case "PASS":
      return "This carrier should fit your trip";
    case "BORDERLINE":
      return "This carrier is borderline for your trip";
    case "NO":
      return "This carrier likely won't fit your trip";
  }
}
