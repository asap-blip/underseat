"use client";

import { useState, useTransition } from "react";

const input = "soft-input";
const label = "soft-label";

export function SaveCheckForm({
  shareToken,
  carrierId,
  airlineId,
  overallStatus,
  routeText,
}: {
  shareToken?: string;
  carrierId?: string | null;
  airlineId?: string | null;
  overallStatus?: string | null;
  routeText?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shareToken) {
      setError("No result to save. Run a check first.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/save-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            shareToken,
            carrierId: carrierId ?? null,
            airlineId: airlineId ?? null,
            overallStatus: overallStatus ?? null,
            routeText: routeText ?? null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        setDone(true);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <section className="soft-panel p-5">
      <h2 className="text-lg font-semibold text-slate-900">Save this result</h2>
      <p className="mt-1 text-sm text-slate-600">
        Get a link to this result emailed to you so you can find it later.
      </p>

      {done ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved! Check your email for the result link.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              required
              className={input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={pending || !email}
            className="primary-cta px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Email me this result"}
          </button>
        </form>
      )}
    </section>
  );
}
