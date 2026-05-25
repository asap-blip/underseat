"use client";

import Link from "next/link";
import { useState } from "react";
import type { Airline, CabinType } from "@/lib/data/types";
import type { Verdict } from "@/lib/rules/engine";
import type { Reason } from "@/lib/rules/reasonCodes";
import { verdictStyles } from "@/lib/ui";

// Compact, embeddable compatibility checker. This is the component intended to
// later power an on-site merchant widget — it talks only to the public
// /api/check contract and renders a self-contained verdict.
export function CheckWidget({
  carrierId,
  carrierLabel,
  airlines,
}: {
  carrierId: string;
  carrierLabel: string;
  airlines: Airline[];
}) {
  const [airlineId, setAirlineId] = useState(airlines[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [cabin, setCabin] = useState<CabinType>("economy");
  const [weightKg, setWeightKg] = useState(5);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setVerdict(null);
    const payload = {
      carrierId,
      pet: { species: "dog", weightKg: Number(weightKg) },
      legs: [
        {
          airlineId,
          origin: origin.trim().toUpperCase() || "AAA",
          destination: destination.trim().toUpperCase() || "BBB",
          cabin,
        },
      ],
    };
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setVerdict(data.result.overall);
        setReasons(data.result.legs[0]?.reasons?.slice(0, 3) ?? []);
        setShareToken(data.shareToken);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-brand-700">Fits your flight?</div>
      <div className="mt-1 font-semibold text-slate-900">{carrierLabel}</div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={airlineId}
          onChange={(e) => setAirlineId(e.target.value)}
        >
          {airlines.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={cabin}
          onChange={(e) => setCabin(e.target.value as CabinType)}
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="From (e.g. JFK)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="To (e.g. LAX)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Pet weight (kg)
          <input
            type="number"
            step="0.1"
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Checking…" : "Check compatibility"}
      </button>

      {verdict && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Result</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${verdictStyles[verdict].bg} ${verdictStyles[verdict].text} ${verdictStyles[verdict].ring}`}>
              {verdict}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {reasons.map((r, i) => (
              <li key={i}>• {r.message}</li>
            ))}
          </ul>
          {shareToken && (
            <Link href={`/result?d=${shareToken}`} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
              See full result →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
