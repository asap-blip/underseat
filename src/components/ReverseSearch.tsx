"use client";

import Link from "next/link";
import { useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { recommendCarriers, type CarrierRecommendation, type FitBand } from "@/lib/recommend";
import { trackedClickUrl } from "@/lib/affiliate";
import { PetMeasureHelp, RecommendationHelp } from "./Help";

const input = "soft-input";
const label = "soft-label";

const fitStyle: Record<FitBand, { label: string; cls: string }> = {
  good: { label: "Likely fits", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  snug: { label: "Snug fit", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  unlikely: { label: "Probably too small", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
];

export function ReverseSearch({ carriers }: { carriers: Carrier[] }) {
  const [species, setSpecies] = useState("dog");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [results, setResults] = useState<CarrierRecommendation[] | null>(null);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weightKg);
    if (!Number.isFinite(w) || w <= 0) {
      setResults(null);
      return;
    }
    const recs = recommendCarriers(
      {
        species: species as "dog" | "cat",
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
      <form onSubmit={search} className="soft-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tell us about your pet</h2>
        <p className="mt-1 text-sm text-slate-600">
          Weight is required. Measurements are optional, but they make the match more accurate.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <label className={label}>Species</label>
            <select className={input} value={species} onChange={(e) => setSpecies(e.target.value)}>
              {SPECIES_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Weight (kg)</label>
            <input type="number" step="0.1" min="0.1" className={input} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </div>
          <div>
            <label className={label}>Length, nose to tail (cm, optional)</label>
            <input type="number" step="0.5" className={input} value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
          </div>
          <div>
            <label className={label}>Standing height (cm, optional)</label>
            <input type="number" step="0.5" className={input} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="primary-cta mt-4 px-5 py-2.5 text-sm">
          <span aria-hidden="true">↗</span>
          Find
        </button>
        <PetMeasureHelp />
      </form>

      {results && (
        <>
          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            These are likely-fit estimates from our carrier list based on size and weight. They are not a
            guarantee, do not account for your pet&apos;s exact shape or behavior, and do not check airline
            rules yet. Pick one and run a trip check next.
          </div>

          <RecommendationHelp />

          {recommended.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nothing in our carrier list looks like a comfortable fit for those measurements. The
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
            <details className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600">
                {excluded.length} carrier{excluded.length === 1 ? "" : "s"} not recommended
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {excluded.map((rec) => (
                  <li key={rec.carrier.id}>
                    {rec.carrier.brand} {rec.carrier.model}: {rec.reasons[0]}
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
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-5">
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
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/check?carrier=${carrier.id}`} className="primary-cta px-3 py-1.5 text-sm">
          <span aria-hidden="true">☞</span>
          Check this against my trip
        </Link>
        <a
          href={trackedClickUrl(carrier.id)}
          rel="nofollow sponsored noopener"
          target="_blank"
          className="secondary-cta px-3 py-1.5 text-sm"
          data-click="affiliate-shop"
          data-carrier={carrier.id}
        >
          <span aria-hidden="true">↗</span>
          Shop
        </a>
      </div>
    </div>
  );
}
