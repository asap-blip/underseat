"use client";

import { useEffect, useState, useTransition } from "react";
import { submitTripFollowup } from "@/app/actions/trip-followup";

const input = "soft-input";
const label = "soft-label";

export function TripFollowupForm({
  carrierId,
  airlineId,
  routeText,
}: {
  carrierId?: string | null;
  airlineId?: string | null;
  routeText?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Capture UTM params (if the visitor arrived from a campaign) for attribution.
  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string }>({});
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtm({
      source: p.get("utm_source") ?? undefined,
      medium: p.get("utm_medium") ?? undefined,
      campaign: p.get("utm_campaign") ?? undefined,
    });
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please tick the box so we know it's OK to email you.");
      return;
    }
    startTransition(async () => {
      const res = await submitTripFollowup({
        email,
        carrierId,
        airlineId,
        departureDate,
        returnDate: returnDate || null,
        routeText,
        consentFollowup: consent,
        utmSource: utm.source ?? null,
        utmMedium: utm.medium ?? null,
        utmCampaign: utm.campaign ?? null,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    });
  }

  return (
    <section className="soft-panel p-5">
      <h2 className="text-lg font-semibold text-slate-900">Did it actually work? Let us follow up</h2>
      <p className="mt-1 text-sm text-slate-600">
        Save your trip and we&apos;ll send one email about a day after you fly to ask whether this
        carrier was accepted. Your answer helps other travelers. We only use your email for this.
      </p>

      {done ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks. Your trip is saved. We&apos;ll be in touch after your departure date. You can
          reply or ignore it; no spam.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
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
            <div>
              <label className={label}>Departure date</label>
              <input
                type="date"
                required
                className={input}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Return date (optional)</label>
              <input
                type="date"
                className={input}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Email me once after my trip to ask how it went. I can opt out anytime.
            </span>
          </label>

          {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={pending || !email || !departureDate || !consent}
            className="primary-cta px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save my trip"}
          </button>
        </form>
      )}
    </section>
  );
}
