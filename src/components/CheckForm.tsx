"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Airline, Carrier, CabinType, PetSpecies } from "@/lib/data/types";

interface LegField {
  airlineId: string;
  origin: string;
  destination: string;
  cabin: CabinType;
  flightNumber?: string;
}

interface FormValues {
  carrierId: string;
  species: PetSpecies;
  petName?: string;
  weightKg: number;
  petLengthCm?: number;
  petHeightCm?: number;
  legs: LegField[];
}

const CABINS: { value: CabinType; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "rabbit", label: "Rabbit" },
  { value: "bird", label: "Bird" },
  { value: "other", label: "Other" },
];

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const label = "block text-xs font-medium text-slate-600 mb-1";

export function CheckForm({
  airlines,
  carriers,
  initialCarrierId,
}: {
  airlines: Airline[];
  carriers: Carrier[];
  initialCarrierId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  const { register, control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      carrierId: initialCarrierId ?? carriers[0]?.id ?? "",
      species: "dog",
      weightKg: 5,
      legs: [{ airlineId: airlines[0]?.id ?? "", origin: "", destination: "", cabin: "economy" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "legs" });
  const selectedCarrierId = watch("carrierId");

  async function lookupCode() {
    setCodeMsg(null);
    if (!code.trim()) return;
    try {
      const res = await fetch(`/api/resolve?code=${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        setCodeMsg("No carrier matched that code.");
        return;
      }
      const data = await res.json();
      setValue("carrierId", data.carrier.id, { shouldDirty: true });
      setCodeMsg(`Loaded: ${data.carrier.brand} ${data.carrier.model}`);
    } catch {
      setCodeMsg("Lookup failed. Try the dropdown instead.");
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    const payload = {
      carrierId: values.carrierId,
      pet: {
        name: values.petName || null,
        species: values.species,
        weightKg: Number(values.weightKg),
        lengthCm: values.petLengthCm ? Number(values.petLengthCm) : null,
        heightCm: values.petHeightCm ? Number(values.petHeightCm) : null,
      },
      legs: values.legs.map((l) => ({
        airlineId: l.airlineId,
        origin: l.origin.trim().toUpperCase(),
        destination: l.destination.trim().toUpperCase(),
        cabin: l.cabin,
        flightNumber: l.flightNumber || null,
      })),
    };
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Check failed");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Carrier */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">1. Your carrier</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Select a carrier</label>
            <select className={input} {...register("carrierId")}>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model} · {c.lengthCm}×{c.widthCm}×{c.heightCm} cm
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Or scan / enter a product code</label>
            <div className="flex gap-2">
              <input
                className={input}
                placeholder="e.g. FPP-SHP-OD-M"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                onClick={lookupCode}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Load
              </button>
            </div>
            {codeMsg && <p className="mt-1 text-xs text-slate-500">{codeMsg}</p>}
          </div>
        </div>
        {selectedCarrierId && (
          <p className="mt-2 text-xs text-slate-400">
            Selected:{" "}
            {(() => {
              const c = carriers.find((x) => x.id === selectedCarrierId);
              return c ? `${c.brand} ${c.model} (${c.softSided ? "soft" : "hard"}-sided)` : selectedCarrierId;
            })()}
          </p>
        )}
      </section>

      {/* Pet */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">2. Your pet</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label}>Species</label>
            <select className={input} {...register("species")}>
              {SPECIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Weight (kg)</label>
            <input type="number" step="0.1" min="0.1" className={input} {...register("weightKg", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={label}>Length (cm, optional)</label>
            <input type="number" step="0.5" className={input} {...register("petLengthCm", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={label}>Standing height (cm, optional)</label>
            <input type="number" step="0.5" className={input} {...register("petHeightCm", { valueAsNumber: true })} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Measurements are optional but let us flag comfort risk (room to stand and turn).
        </p>
      </section>

      {/* Itinerary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">3. Your itinerary</h2>
          <button
            type="button"
            onClick={() => append({ airlineId: airlines[0]?.id ?? "", origin: "", destination: "", cabin: "economy" })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            + Add leg
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {fields.map((field, i) => (
            <div key={field.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Leg {i + 1}</span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-xs text-rose-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <label className={label}>Airline</label>
                  <select className={input} {...register(`legs.${i}.airlineId` as const)}>
                    {airlines.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>From</label>
                  <input className={input} placeholder="YYZ" {...register(`legs.${i}.origin` as const)} />
                </div>
                <div>
                  <label className={label}>To</label>
                  <input className={input} placeholder="LHR" {...register(`legs.${i}.destination` as const)} />
                </div>
                <div>
                  <label className={label}>Cabin</label>
                  <select className={input} {...register(`legs.${i}.cabin` as const)}>
                    {CABINS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className={label}>Flight number (optional)</label>
                  <input className={input} placeholder="AC 856" {...register(`legs.${i}.flightNumber` as const)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Check compatibility"}
        </button>
      </div>
    </form>
  );
}
