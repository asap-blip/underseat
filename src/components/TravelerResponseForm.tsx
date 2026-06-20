"use client";

import { useState, useTransition } from "react";
import { submitTravelerResponse } from "@/app/actions/traveler-response";

type Outcome = "worked" | "did_not_work" | "mixed";

const OUTCOMES: { value: Outcome; label: string; hint: string }[] = [
  { value: "worked", label: "It worked", hint: "Accepted in the cabin, no issues" },
  { value: "did_not_work", label: "It didn't work", hint: "Turned away or made to change" },
  { value: "mixed", label: "Mixed", hint: "Allowed, but with hassle or on one leg only" },
];

const STAGES = [
  { value: "", label: "Where did it come up? (optional)" },
  { value: "check_in", label: "At check-in" },
  { value: "gate", label: "At the gate" },
  { value: "boarding", label: "While boarding" },
  { value: "onboard", label: "Onboard" },
];

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function TravelerResponseForm({
  followupId,
  routeText,
  initialOutcome,
}: {
  followupId: string;
  routeText?: string | null;
  initialOutcome?: Outcome;
}) {
  const [outcome, setOutcome] = useState<Outcome | null>(initialOutcome ?? null);
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!outcome) {
      setError("Please choose what happened.");
      return;
    }
    startTransition(async () => {
      const res = await submitTravelerResponse({
        followupId,
        outcome,
        stage: stage || null,
        notes: notes || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Thank you 🐾</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your answer is recorded{routeText ? ` for ${routeText}` : ""}. It helps other pet owners
          travel with confidence. You also won&apos;t get any more emails about this trip.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">How did it go?</h1>
      <p className="mt-1 text-sm text-slate-600">
        {routeText ? `For your trip ${routeText}: ` : ""}was your carrier accepted in the cabin? One
        tap is all we need.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOutcome(o.value)}
            aria-pressed={outcome === o.value}
            className={`rounded-xl border p-3 text-left ${
              outcome === o.value
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-sm font-medium text-slate-900">{o.label}</div>
            <div className="mt-0.5 text-xs text-slate-500">{o.hint}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select className={input} value={stage} onChange={(e) => setStage(e.target.value)}>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          className={input}
          placeholder="Anything worth noting? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
        />
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={pending || !outcome}
        className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Submit"}
      </button>
      <p className="mt-3 text-xs text-slate-400">
        Reports are reviewed before they inform any carrier&apos;s status.
      </p>
    </form>
  );
}
