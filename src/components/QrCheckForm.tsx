"use client";

import { useState, useEffect } from "react";
import type { Airline, Carrier, CabinType } from "@/lib/data/types";

const CABINS: { value: CabinType; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

interface CheckResult {
  fits: boolean | null;
  reason: string;
  checkId?: string;
}

export function QrCheckForm({
  carrier,
  airlines,
}: {
  carrier: Carrier;
  airlines: Airline[];
}) {
  const [airlineId, setAirlineId] = useState("");
  const [cabin, setCabin] = useState<CabinType>("economy");
  const [petWeight, setPetWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  // Pick up query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("airline");
    const c = params.get("cabin") as CabinType | null;
    if (a) setAirlineId(a);
    if (c && CABINS.some((cb) => cb.value === c)) setCabin(c);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!airlineId || !petWeight) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierId: carrier.id,
          pet: { species: "dog", weightKg: parseFloat(petWeight) },
          legs: [{ airlineId, cabin }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Check failed");
        return;
      }

      const overall = data.result?.overall;
      const fits = overall === "PASS" || overall === "BORDERLINE";
      setResult({
        fits,
        reason: fits
          ? `${carrier.brand} ${carrier.model} fits on this flight.`
          : `${carrier.brand} ${carrier.model} may not fit on this flight. Check the details below.`,
        checkId: data.meta?.checkId,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError("");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Branding */}
      <div className="text-center">
        <div className="text-3xl" aria-hidden="true">🐾</div>
        <h1 className="mt-1 text-xl font-extrabold text-navy">Underseat</h1>
        <p className="text-xs text-slate-500">Pet carrier flight check</p>
      </div>

      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Carrier info */}
          <div className="rounded-xl border border-brand-200 bg-white p-4 text-center">
            <div className="text-xs font-extrabold uppercase tracking-wide text-caramel">{carrier.brand}</div>
            <div className="text-lg font-extrabold text-navy">{carrier.model}</div>
            <div className="mt-1 text-xs text-slate-500">
              {carrier.weightKg} kg · {carrier.lengthCm}×{carrier.widthCm}×{carrier.heightCm} cm
            </div>
          </div>

          {/* Airline */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Airline</label>
            <select
              value={airlineId}
              onChange={(e) => setAirlineId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-slate-900"
              required
            >
              <option value="">Select airline</option>
              {airlines.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cabin */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Cabin</label>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as CabinType)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-slate-900"
            >
              {CABINS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pet weight */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Pet weight (kg)</label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.1"
              value={petWeight}
              onChange={(e) => setPetWeight(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-slate-900"
              placeholder="e.g. 5"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !airlineId || !petWeight}
            className="w-full rounded-xl bg-navy py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Checking..." : "Check fit"}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 text-center">
          {/* Big verdict */}
          <div
            className={`rounded-2xl p-6 ${
              result.fits
                ? "bg-emerald-50 ring-2 ring-emerald-300"
                : "bg-red-50 ring-2 ring-red-300"
            }`}
          >
            <div className="text-5xl" aria-hidden="true">
              {result.fits ? "✅" : "❌"}
            </div>
            <div
              className={`mt-3 text-2xl font-extrabold ${
                result.fits ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {result.fits ? "Fits!" : "Doesn't fit"}
            </div>
            <p className="mt-2 text-sm text-slate-600">{result.reason}</p>
          </div>

          {/* CTA */}
          {result.fits && carrier.affiliateUrl && (
            <a
              href={carrier.affiliateUrl}
              rel="nofollow sponsored noopener"
              target="_blank"
              className="block w-full rounded-xl bg-navy py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
            >
              Buy this carrier ↗
            </a>
          )}
          {!result.fits && (
            <a
              href="/carriers"
              className="block w-full rounded-xl border border-navy py-3 text-sm font-extrabold text-navy transition-colors hover:bg-navy/5"
            >
              Browse other carriers
            </a>
          )}

          <button
            onClick={handleReset}
            className="text-xs font-medium text-slate-500 underline transition-colors hover:text-slate-700"
          >
            Check another airline or cabin
          </button>
        </div>
      )}

      {/* Not a guarantee */}
      <p className="text-center text-[10px] text-slate-400">
        Underseat is a compatibility checker, not a guarantee. Airlines make the final decision.
      </p>
    </div>
  );
}