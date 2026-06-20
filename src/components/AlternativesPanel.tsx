import Link from "next/link";
import type { AlternativeSuggestion } from "@/lib/check/service";
import { CarrierCard } from "./CarrierCard";

export function AlternativesPanel({
  alternatives,
  heading,
}: {
  alternatives: AlternativeSuggestion[];
  heading: string;
}) {
  if (alternatives.length === 0) {
    return (
      <section className="soft-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">No clear fit in our carrier list yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          No carriers in our carrier list clear every leg of your itinerary. That does not mean one does
          not exist. We just have not verified it yet.
        </p>
        <Link href="/carriers" className="secondary-cta mt-3 px-4 py-2 text-sm">
          <span aria-hidden="true">+</span>
          Suggest
        </Link>
      </section>
    );
  }

  return (
    <section className="soft-panel p-5">
      <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alt) => (
          <div key={alt.carrier.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-4">
            <CarrierCard carrier={alt.carrier} />
            <div className="mt-4 space-y-1 text-xs text-slate-600">
              {alt.reasons.map((r, i) => (
                <div key={i} className="flex gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        These are affiliate links. We may earn a commission from qualifying purchases. Suggestions are
        ranked by fit against your itinerary, never by commission.
      </p>
    </section>
  );
}
