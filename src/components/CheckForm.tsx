"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Airline, Carrier, CabinType, PetSpecies } from "@/lib/data/types";
import {
  ALL_CABINS,
  CABIN_LABELS,
  coverageBadge,
  isCabinModeled,
  type CoverageMap,
} from "@/lib/coverage";
import { CarrierMeasureHelp, FlightInfoHelp, PetMeasureHelp } from "./Help";

interface LegField {
  airlineId: string;
  origin?: string | null;
  destination?: string | null;
  cabin: CabinType;
  flightNumber?: string;
  marketedCarrierId?: string;
  operatingCarrierId?: string;
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

const SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "rabbit", label: "Rabbit" },
  { value: "bird", label: "Bird" },
  { value: "other", label: "Other" },
];

const input = "soft-input";
const label = "soft-label";

// Sentinel for "operated by an airline we don't model". Kept out of the airline
// list so the user never picks a misleading modeled substitute.
const UNKNOWN_OPERATING = "__unknown__";

export function CheckForm({
  airlines,
  carriers,
  coverage,
  initialCarrierId,
}: {
  airlines: Airline[];
  carriers: Carrier[];
  coverage: CoverageMap;
  initialCarrierId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customL, setCustomL] = useState("");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [customSoft, setCustomSoft] = useState(true);
  const [customName, setCustomName] = useState("");

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
  const legs = watch("legs");

  const airlineName = (id?: string) => airlines.find((a) => a.id === id)?.name ?? id ?? "";

  // Resolve the airline whose rules apply for a leg: operating > marketed >
  // booking. The UNKNOWN sentinel is not a real airline, so it never overrides.
  const evalAirlineId = (leg: LegField) =>
    leg.operatingCarrierId && leg.operatingCarrierId !== UNKNOWN_OPERATING
      ? leg.operatingCarrierId
      : leg.marketedCarrierId || leg.airlineId;

  const isUnknownOperating = (leg: LegField) => leg.operatingCarrierId === UNKNOWN_OPERATING;

  const distinctEvalAirlines = new Set((legs ?? []).map((l) => evalAirlineId(l)));
  const hasCodeshare = (legs ?? []).some(
    (l) =>
      l.operatingCarrierId &&
      l.operatingCarrierId !== UNKNOWN_OPERATING &&
      l.operatingCarrierId !== (l.marketedCarrierId || l.airlineId),
  );
  const hasUnknownOperating = (legs ?? []).some(isUnknownOperating);

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

    // Validate custom dimensions
    if (customMode) {
      const l = Number(customL);
      const w = Number(customW);
      const h = Number(customH);
      if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) {
        setError("Please enter valid dimensions in cm.");
        setSubmitting(false);
        return;
      }
    }

    const payload = customMode
      ? {
          carrierDimensions: {
            lengthCm: Number(customL),
            widthCm: Number(customW),
            heightCm: Number(customH),
            softSided: customSoft,
          },
          pet: {
            name: values.petName || null,
            species: values.species,
            weightKg: Number(values.weightKg),
            lengthCm: values.petLengthCm ? Number(values.petLengthCm) : null,
            heightCm: values.petHeightCm ? Number(values.petHeightCm) : null,
          },
          legs: values.legs.map((l) => {
            const unknownOperating = l.operatingCarrierId === UNKNOWN_OPERATING;
            return {
              airlineId: l.airlineId,
              origin: l.origin?.trim().toUpperCase() ?? null,
              destination: l.destination?.trim().toUpperCase() ?? null,
              cabin: l.cabin,
              flightNumber: l.flightNumber || null,
              marketedCarrierId: l.marketedCarrierId || null,
              operatingCarrierId: unknownOperating ? null : l.operatingCarrierId || null,
              operatingCarrierUnknown: unknownOperating,
            };
          }),
        }
      : {
          carrierId: values.carrierId,
          pet: {
            name: values.petName || null,
            species: values.species,
            weightKg: Number(values.weightKg),
            lengthCm: values.petLengthCm ? Number(values.petLengthCm) : null,
            heightCm: values.petHeightCm ? Number(values.petHeightCm) : null,
          },
          legs: values.legs.map((l) => {
            const unknownOperating = l.operatingCarrierId === UNKNOWN_OPERATING;
            return {
              airlineId: l.airlineId,
              origin: l.origin?.trim().toUpperCase() ?? null,
              destination: l.destination?.trim().toUpperCase() ?? null,
              cabin: l.cabin,
              flightNumber: l.flightNumber || null,
              marketedCarrierId: l.marketedCarrierId || null,
              operatingCarrierId: unknownOperating ? null : l.operatingCarrierId || null,
              operatingCarrierUnknown: unknownOperating,
            };
          }),
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
      <section className="soft-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">1. Your carrier</h2>

        {/* Toggle between carrier list and manual */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              !customMode
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Choose a carrier
          </button>
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              customMode
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Enter dimensions manually
          </button>
        </div>

        {customMode ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className={label}>Carrier name <span className="font-normal text-slate-400">optional</span></label>
              <input
                className={input}
                placeholder="e.g. Sherpa Original Medium"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label}>Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="45"
                  value={customL}
                  onChange={(e) => setCustomL(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="30"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="25"
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  className={input}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={customSoft}
                onChange={(e) => setCustomSoft(e.target.checked)}
                className="rounded border-slate-300"
              />
              Soft-sided carrier (compresses under the seat)
            </label>
            <CarrierMeasureHelp />
          </div>
        ) : (
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
                  className="secondary-cta shrink-0 px-3 py-2 text-sm"
                >
                  <span aria-hidden="true">⌕</span>
                  Load
                </button>
              </div>
              {codeMsg && <p className="mt-1 text-xs text-slate-500">{codeMsg}</p>}
            </div>
          </div>
        )}
        {selectedCarrierId && !customMode && (
          <p className="mt-2 text-xs text-slate-400">
            Selected:{" "}
            {(() => {
              const c = carriers.find((x) => x.id === selectedCarrierId);
              return c ? `${c.brand} ${c.model} (${c.softSided ? "soft" : "hard"}-sided)` : selectedCarrierId;
            })()}
          </p>
        )}
        {customMode && (
          <p className="mt-2 text-xs text-slate-400">
            Enter your carrier&apos;s external dimensions. We&apos;ll check them against the airline&apos;s rules.
          </p>
        )}
      </section>

      {/* Pet */}
      <section className="soft-panel p-5">
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
            <label className={label}>Length <span className="font-normal text-slate-400">(cm · nose to base of tail)</span></label>
            <input type="number" step="0.5" className={input} {...register("petLengthCm", { valueAsNumber: true })} />
          </div>
          <div>
            <label className={label}>Standing height <span className="font-normal text-slate-400">(cm · floor to head/ears)</span></label>
            <input type="number" step="0.5" className={input} {...register("petHeightCm", { valueAsNumber: true })} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Measurements are optional but let us flag comfort risk (room to stand and turn).
        </p>
        <PetMeasureHelp />
      </section>

      {/* Itinerary */}
      <section className="soft-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">3. Your itinerary</h2>
          <button
            type="button"
            onClick={() => append({ airlineId: airlines[0]?.id ?? "", origin: "", destination: "", cabin: "economy" })}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Add leg
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Add one leg per flight. Each leg is checked separately against its airline&apos;s rules.
        </p>
        <FlightInfoHelp />

        <div className="mt-4 space-y-4">
          {fields.map((field, i) => {
            const leg = legs?.[i];
            const bookingCov = leg ? coverage[leg.airlineId] : undefined;
            const evalId = leg ? evalAirlineId(leg) : "";
            const evalCov = coverage[evalId];
            const supportedCabins = (evalCov?.cabins ?? ["economy"]) as CabinType[];
            const unsupportedCabins = ALL_CABINS.filter((c) => !supportedCabins.includes(c));
            const cabinModeledHere = leg ? isCabinModeled(evalCov, leg.cabin) : true;
            const codeshareHere = Boolean(
              leg?.operatingCarrierId && leg.operatingCarrierId !== (leg.marketedCarrierId || leg.airlineId),
            );

            return (
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
                    <label className={label}>Airline (booking)</label>
                    <select className={input} {...register(`legs.${i}.airlineId` as const)}>
                      {airlines.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {bookingCov && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                          {coverageBadge(bookingCov)}
                        </span>
                        {!bookingCov.hasDimensions && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            No published dimensions
                          </span>
                        )}
                      </div>
                    )}
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
                      {supportedCabins.map((c) => (
                        <option key={c} value={c}>{CABIN_LABELS[c]}</option>
                      ))}
                      {unsupportedCabins.length > 0 && (
                        <optgroup label="Not separately modeled (uses economy)">
                          {unsupportedCabins.map((c) => (
                            <option key={c} value={c}>{CABIN_LABELS[c]}: uses economy rule</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={label}>Flight number (optional)</label>
                    <input className={input} placeholder="AC 856" {...register(`legs.${i}.flightNumber` as const)} />
                  </div>
                  <div>
                    <label className={label}>Marketed by (optional)</label>
                    <select className={input} {...register(`legs.${i}.marketedCarrierId` as const)}>
                      <option value="">Same as airline</option>
                      {airlines.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Operated by (optional)</label>
                    <select className={input} {...register(`legs.${i}.operatingCarrierId` as const)}>
                      <option value="">Same as airline</option>
                      {airlines.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      <option value={UNKNOWN_OPERATING}>Another airline, not listed or unknown</option>
                    </select>
                  </div>
                </div>

                {/* Explicit, pre-submit honesty notices */}
                {!cabinModeledHere && leg && (
                  <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {CABIN_LABELS[leg.cabin]} isn&apos;t separately modeled for {airlineName(evalId)}. We&apos;ll
                    evaluate this leg against its <strong>economy</strong> rule, which may be more conservative.
                  </p>
                )}
                {leg && isUnknownOperating(leg) && (
                  <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    You marked this leg as operated by an airline we don&apos;t model yet. We&apos;ll show an
                    indicative result based on {airlineName(leg.marketedCarrierId || leg.airlineId)}, but we
                    <strong> can&apos;t confirm it</strong> against the policy that actually applies. This leg
                    will be capped at <strong>Tight fit</strong> with reduced confidence. Confirm directly
                    with the operating airline.
                  </p>
                )}
                {leg &&
                  !isUnknownOperating(leg) &&
                  leg.operatingCarrierId &&
                  leg.operatingCarrierId !== leg.airlineId && (
                    <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
                      Rules will be evaluated against the operating carrier, {airlineName(leg.operatingCarrierId)}
                      {codeshareHere ? ", which looks like a codeshare or partner-operated flight." : "."}
                    </p>
                  )}
              </div>
            );
          })}
        </div>

        {/* Trip-level pre-submit warnings */}
        {distinctEvalAirlines.size > 1 && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Your itinerary uses more than one airline. Each leg is checked separately. Acceptance on one
            airline does <strong>not</strong> guarantee acceptance on another.
          </p>
        )}
        {hasCodeshare && (
          <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
            A leg may be operated by a partner (codeshare). The operating carrier&apos;s pet policy is what
            applies at the gate. Confirm directly with them.
          </p>
        )}
        {hasUnknownOperating && (
          <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
            A leg is operated by an airline we don&apos;t model yet, so that leg is indicative only and
            can&apos;t be confirmed against the policy that actually applies.
          </p>
        )}
      </section>

      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="primary-cta px-5 py-2.5 font-medium disabled:opacity-60"
        >
          {submitting ? "Checking…" : (
            <>
              <span aria-hidden="true">⌕</span>
              Check
            </>
          )}
        </button>
      </div>
    </form>
  );
}
