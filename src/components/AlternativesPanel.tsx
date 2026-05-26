import Link from "next/link";
import type { AlternativeSuggestion } from "@/lib/check/service";
import { trackedClickUrl } from "@/lib/affiliate";

export function AlternativesPanel({
  alternatives,
  checkToken,
  heading,
}: {
  alternatives: AlternativeSuggestion[];
  checkToken?: string;
  heading: string;
}) {
  if (alternatives.length === 0) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alt) => (
          <div key={alt.carrier.id} className="flex flex-col rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-500">{alt.carrier.brand}</div>
            <div className="font-semibold text-slate-900">{alt.carrier.model}</div>
            <div className="mt-1 text-xs text-slate-500">
              {alt.carrier.lengthCm} × {alt.carrier.widthCm} × {alt.carrier.heightCm} cm
              {alt.carrier.softSided ? " · soft-sided" : " · hard-sided"}
            </div>
            <ul className="mt-3 flex-1 space-y-1 text-xs text-slate-600">
              {alt.reasons.map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-2">
              {alt.carrier.priceUsd != null && (
                <span className="text-sm font-medium text-slate-700">~${alt.carrier.priceUsd}</span>
              )}
              <div className="flex flex-col items-end gap-0.5">
                <Link
                  href={trackedClickUrl(alt.carrier.id, "amazon", checkToken)}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Shop this carrier
                </Link>
                <span className="text-[10px] text-slate-400">Affiliate link</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        These are affiliate links — we may earn a commission from qualifying purchases. Suggestions are
        ranked by fit against your itinerary, never by payout.
      </p>
    </section>
  );
}
