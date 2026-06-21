"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { Airline, CabinType } from "@/lib/data/types";
import { ALL_CABINS, CABIN_LABELS } from "@/lib/coverage";

export function QuickCheckHero({ airlines }: { airlines: Airline[] }) {
  const router = useRouter();
  const [airlineId, setAirlineId] = useState(airlines[0]?.id ?? "");
  const [cabin, setCabin] = useState<CabinType>("economy");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [petWeightKg, setPetWeightKg] = useState("");
  const [softSided, setSoftSided] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const l = Number(lengthCm);
    const w = Number(widthCm);
    const h = Number(heightCm);
    if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) {
      setError("Please enter valid dimensions in cm.");
      setSubmitting(false);
      return;
    }
    if (!airlineId) {
      setError("Please select an airline.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      carrierDimensions: { lengthCm: l, widthCm: w, heightCm: h, softSided },
      pet: {
        species: "dog" as const,
        weightKg: petWeightKg ? Number(petWeightKg) : 5,
      },
      legs: [
        {
          airlineId,
          origin: "",
          destination: "",
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
      if (!res.ok) {
        setError(data.error ?? "Check failed. Try the full check page.");
        setSubmitting(false);
        return;
      }
      router.push(`/result?d=${data.shareToken}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flight-check-form">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="section-eyebrow">
          <span aria-hidden="true">✈</span>
          Trip check
        </span>
        <span className="text-xs text-slate-500">For one flight leg.</span>
      </div>

      {/* Inputs: airline, cabin, length, width, height. Stacks on 375px, row on sm+. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2.4fr_1.2fr_0.7fr_0.7fr_0.7fr] sm:items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="soft-label">Airline</label>
          <select
            value={airlineId}
            onChange={(e) => setAirlineId(e.target.value)}
            className="soft-input"
          >
            {airlines.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="soft-label">Cabin</label>
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as CabinType)}
            className="soft-input"
          >
            {ALL_CABINS.map((c) => (
              <option key={c} value={c}>{CABIN_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="soft-label">Length (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="45"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
            className="soft-input"
          />
        </div>
        <div>
          <label className="soft-label">Width (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="30"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
            className="soft-input"
          />
        </div>
        <div>
          <label className="soft-label">Height (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="25"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="soft-input"
          />
        </div>
      </div>

      {/* Soft-sided / Hard-sided toggle */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs font-medium text-slate-600">Carrier type:</span>
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setSoftSided(true)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              softSided
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Soft-sided
          </button>
          <button
            type="button"
            onClick={() => setSoftSided(false)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              !softSided
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Hard-sided
          </button>
        </div>
        {!softSided && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Fewer airline fits
          </span>
        )}
      </div>

      {/* Pet weight + CTA row */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="w-full sm:w-44">
          <label className="soft-label">
            Pet weight (kg) <span className="font-normal text-slate-400">optional</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="50"
            placeholder="5"
            value={petWeightKg}
            onChange={(e) => setPetWeightKg(e.target.value)}
            className="soft-input"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="primary-cta w-full px-6 py-2.5 text-sm disabled:opacity-60 sm:w-auto sm:shrink-0 sm:px-8"
        >
          {submitting ? "Checking…" : (
            <>
              <span aria-hidden="true">⌕</span>
              Check
            </>
          )}
        </button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-xs text-slate-500">
        For multi-leg trips or a specific product code, use the{" "}
        <a href="/check" className="font-medium text-brand-700 underline">full trip check</a>.
      </p>

      {error && (
        <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}
    </form>
  );
}
