import Link from "next/link";
import { trackedClickUrl } from "@/lib/affiliate";
import type { AlternativeSuggestion } from "@/lib/check/service";
import { CarrierCard } from "./CarrierCard";

export function AlternativesPanel({
  alternatives,
  heading,
  urgent = false,
}: {
  alternatives: AlternativeSuggestion[];
  heading: string;
  urgent?: boolean;
}) {
  if (alternatives.length === 0) {
    return (
      <section className="soft-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">No clear fit in our carrier list yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          No carriers in our carrier list clear every leg of your itinerary. That does not mean one does
          not exist. We just have not verified it yet.
        </p>
        <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <h3 className="text-sm font-bold text-amber-900">Don&apos;t see a fit? Need help choosing?</h3>
          <p className="mt-1 text-xs text-amber-800">
            Let us know what you&apos;re looking for and we can help find the right carrier.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/carriers" className="secondary-cta px-4 py-2 text-sm">
              Browse all carriers
            </Link>
          </div>
        </div>
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
            {urgent && (
              <a
                href={trackedClickUrl(alt.carrier.id)}
                rel="nofollow sponsored noopener"
                target="_blank"
                className="primary-cta mt-3 w-full px-4 py-2.5 text-center text-sm font-bold"
              >
                Buy Now
              </a>
            )}
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
