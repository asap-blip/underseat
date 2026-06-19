"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Airline } from "@/lib/data/types";

export function QuickCheckHero({ airlines }: { airlines: Airline[] }) {
  const router = useRouter();
  const [airlineId, setAirlineId] = useState(airlines[0]?.id ?? "");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [petWeightKg, setPetWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
      carrierDimensions: { lengthCm: l, widthCm: w, heightCm: h, softSided: true },
      pet: {
        species: "dog" as const,
        weightKg: petWeightKg ? Number(petWeightKg) : 5,
      },
      legs: [
        {
          airlineId,
          origin: "",
          destination: "",
          cabin: "economy" as const,
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Quick check
        </span>
        <span className="text-xs text-slate-400">Result in 60 seconds.</span>
      </div>

      {/* 3-input row: airline + L + W + H — stacks on 375px, row on sm+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Airline</label>
          <select
            value={airlineId}
            onChange={(e) => setAirlineId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {airlines.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">L (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="45"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">W (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="30"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">H (cm)</label>
          <input
            type="number"
            min="1"
            max="200"
            placeholder="25"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Pet weight + CTA row */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-medium text-slate-600">
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {submitting ? "Checking…" : "Check now"}
        </button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-xs text-slate-400">
        Carrier assumed soft-sided. For hard-sided or multi-leg trips, use the{" "}
        <a href="/check" className="text-brand-700 underline">full check</a>.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}
    </form>
  );
}
