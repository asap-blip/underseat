"use client";

import { useState } from "react";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Lightweight demand capture: which carriers should we add to the curated catalog?
export function SuggestCarrier() {
  const [carrier, setCarrier] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!carrier.trim()) return;
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/carrier-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: carrier.trim(), email: email || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.error ?? "Could not submit. Please try again.");
        return;
      }
      setStatus("done");
      setCarrier("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Don&apos;t see your carrier?</h2>
      <p className="mt-1 text-sm text-slate-600">
        We track a curated set, not every bag. Tell us which carrier to add and we&apos;ll look into
        verifying its dimensions.
      </p>
      {status === "done" ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks — we&apos;ve logged your suggestion.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <input
            className={input}
            placeholder="Carrier brand & model (e.g. Sleepypod Air)"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            required
          />
          <input
            className={input}
            type="email"
            placeholder="Email to be notified (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={status === "saving" || !carrier.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {status === "saving" ? "Submitting…" : "Suggest carrier"}
          </button>
          {message && <span className="text-xs text-rose-600 sm:col-span-3">{message}</span>}
        </form>
      )}
    </section>
  );
}
