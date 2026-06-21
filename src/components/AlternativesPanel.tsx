"use client";

import Link from "next/link";
import { useState } from "react";
import { trackedClickUrl } from "@/lib/affiliate";
import type { AlternativeSuggestion } from "@/lib/check/service";

export function AlternativesPanel({
  alternatives,
  heading,
  urgent = false,
  carrierId,
  airlineId,
  routeText,
}: {
  alternatives: AlternativeSuggestion[];
  heading: string;
  urgent?: boolean;
  carrierId?: string;
  airlineId?: string;
  routeText?: string;
}) {
  if (alternatives.length === 0) {
    return (
      <section className="soft-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">No clear fit in our carrier list yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          No carriers in our carrier list clear every leg of your itinerary. That does not mean one does
          not exist. We just have not verified it yet.
        </p>

        {/* Email capture for leads */}
        <LeadCaptureBox carrierId={carrierId} airlineId={airlineId} routeText={routeText} />

        <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <h3 className="text-sm font-bold text-amber-900">Don&apos;t see a fit? Need help choosing?</h3>
          <p className="mt-1 text-xs text-amber-800">
            Let us know what you&apos;re looking for and we can help find the right carrier.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/carriers" className="secondary-cta px-4 py-2 text-sm">
              Browse all carriers
            </Link>
          </div>
        </div>
        <Link href="/carriers" className="secondary-cta mt-3 px-4 py-2 text-sm">
          <span aria-hidden="true">+</span>
          Suggest
        </Link>
      </section>
    );
  }

  return (
    <section className="soft-panel p-5">
      <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alt) => (
          <div key={alt.carrier.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-slate-500">{alt.carrier.brand}</div>
                <div className="font-semibold text-slate-900">{alt.carrier.model}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {alt.carrier.lengthCm}×{alt.carrier.widthCm}×{alt.carrier.heightCm} cm · {alt.carrier.weightKg} kg
                </div>
              </div>
              {alt.carrier.priceUsd != null && (
                <div className="shrink-0 text-sm font-semibold text-slate-700">${alt.carrier.priceUsd}</div>
              )}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              {alt.reasons.map((r, i) => (
                <div key={i} className="flex gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex gap-2 pt-3">
              <Link
                href={`/check?carrier=${alt.carrier.id}`}
                className="secondary-cta flex-1 px-3 py-2 text-sm text-center"
              >
                Check
              </Link>
              <a
                href={trackedClickUrl(alt.carrier.id)}
                rel="nofollow sponsored noopener"
                target="_blank"
                className={`px-3 py-2 text-sm text-center flex-1 ${
                  urgent
                    ? "primary-cta font-bold"
                    : "secondary-cta"
                }`}
                data-click="affiliate-shop"
                data-carrier={alt.carrier.id}
              >
                {urgent ? "Buy Now" : "Shop"}
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        These are affiliate links. We may earn a commission from qualifying purchases. Suggestions are
        ranked by fit against your itinerary, never by commission.
      </p>
    </section>
  );
}

function LeadCaptureBox({
  carrierId,
  airlineId,
  routeText,
}: {
  carrierId?: string;
  airlineId?: string;
  routeText?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          carrierId: carrierId || null,
          airlineId: airlineId || null,
          routeText: routeText || null,
          source: "no-fit",
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
        <p className="text-sm font-medium text-emerald-800">
          ✓ We&apos;ll let you know when we add a matching carrier.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-sky-300 bg-sky-50 p-5">
      <h3 className="text-sm font-bold text-sky-900">Don&apos;t see a fit?</h3>
      <p className="mt-1 text-xs text-sky-800">
        Enter your email and we&apos;ll notify you the moment we add a carrier matching your pet &amp; airline.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-10 flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        <button
          type="submit"
          disabled={pending || !email}
          className="primary-cta min-h-10 px-4 py-2 text-sm disabled:opacity-40"
        >
          {pending ? "Saving…" : "Notify me"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <p className="mt-2 text-[10px] text-sky-600">No spam. One email. Unsubscribe anytime.</p>
    </div>
  );
}
