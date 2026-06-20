"use client";

import { useState } from "react";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Lightweight demand-capture form. Turns coverage gaps into research input.
export function RequestAirline() {
  const [airline, setAirline] = useState("");
  const [cabin, setCabin] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!airline.trim()) return;
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/airline-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ airline: airline.trim(), cabin: cabin || null, email: email || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.error ?? "Could not submit. Please try again.");
        return;
      }
      setStatus("done");
      setAirline("");
      setCabin("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Missing an airline?</h2>
      <p className="mt-1 text-sm text-slate-600">
        We don&apos;t cover every airline or cabin yet. Tell us which one you need and we&apos;ll
        prioritize it. We&apos;d rather add what travelers actually want than pretend it&apos;s there.
      </p>

      {status === "done" ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks. We&apos;ve logged your request. Want another? Just submit again.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            className={input}
            placeholder="Airline (e.g. Qantas)"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Cabin (optional)"
            value={cabin}
            onChange={(e) => setCabin(e.target.value)}
          />
          <input
            className={input}
            type="email"
            placeholder="Email to be notified (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={status === "saving" || !airline.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {status === "saving" ? "Submitting…" : "Request this airline"}
            </button>
            {message && <span className="ml-3 text-xs text-rose-600">{message}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
