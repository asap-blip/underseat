"use client";

import Link from "next/link";
import { useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { recommendCarriers, type CarrierRecommendation, type FitBand } from "@/lib/recommend";
import { trackedClickUrl } from "@/lib/affiliate";
import { PetMeasureHelp, RecommendationHelp } from "./Help";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const label = "block text-xs font-medium text-slate-600 mb-1";

const fitStyle: Record<FitBand, { label: string; cls: string }> = {
  good: { label: "Likely fits", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  snug: { label: "Snug fit", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  unlikely: { label: "Probably too small", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function ReverseSearch({ carriers }: { carriers: Carrier[] }) {
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [results, setResults] = useState<CarrierRecommendation[] | null>(null);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weightKg);
    if (!Number.isFinite(w) || w <= 0) return;
    const recs = recommendCarriers(
      {
        weightKg: w,
        lengthCm: lengthCm ? Number(lengthCm) : null,
        heightCm: heightCm ? Number(heightCm) : null,
      },
      carriers,
    );
    setResults(recs);
  }

  const recommended = results?.filter((r) => r.fit !== "unlikely") ?? [];
  const excluded = results?.filter((r) => r.fit === "unlikely") ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tell us about your pet</h2>
        <p className="mt-1 text-sm text-slate-600">
          Weight is required. Measurements are optional but make the match much more accurate.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Weight (kg)</label>
            <input type="number" step="0.1" min="0.1" className={input} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </div>
          <div>
            <label className={label}>Length nose–tail (cm, optional)</label>
            <input type="number" step="0.5" className={input} value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
          </div>
          <div>
            <label className={label}>Standing height (cm · floor to head/ears, optional)</label>
            <input type="number" step="0.5" className={input} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          Find matching carriers
        </button>
        <PetMeasureHelp />
      </form>

      {results && (
        <>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            These are likely-fit estimates from our curated catalog based on size and weight — not a
            guarantee. They don&apos;t account for your pet&apos;s exact shape or behaviour, and they
            don&apos;t yet check airline rules. Pick one and run a trip check next.
          </div>

          <RecommendationHelp />

          {recommended.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nothing in our curated catalog looks like a comfortable fit for those measurements. The
              carriers below are likely too small.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((rec) => (
                <RecommendationCard key={rec.carrier.id} rec={rec} />
              ))}
            </div>
          )}

          {excluded.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600">
                {excluded.length} carrier{excluded.length === 1 ? "" : "s"} we didn&apos;t recommend (likely too small or over weight)
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {excluded.map((rec) => (
                  <li key={rec.carrier.id}>
                    {rec.carrier.brand} {rec.carrier.model} — {rec.reasons[0]}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: CarrierRecommendation }) {
  const { carrier } = rec;
  const s = fitStyle[rec.fit];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-slate-500">{carrier.brand}</div>
          <div className="font-semibold text-slate-900">{carrier.model}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${s.cls}`}>{s.label}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {carrier.lengthCm} × {carrier.widthCm} × {carrier.heightCm} cm · {carrier.softSided ? "soft-sided" : "hard-sided"}
      </div>
      <ul className="mt-3 flex-1 space-y-1 text-xs text-slate-600">
        {rec.reasons.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-emerald-500">✓</span>
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Link
          href={`/check?carrier=${carrier.id}`}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Check my trip →
        </Link>
        <div className="flex flex-col items-end">
          <Link
            href={trackedClickUrl(carrier.id)}
            rel="nofollow sponsored noopener"
            target="_blank"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Shop{carrier.priceUsd != null ? ` ~$${carrier.priceUsd}` : ""}
          </Link>
          <span className="text-[10px] text-slate-400">Affiliate link</span>
        </div>
      </div>
    </div>
  );
}
