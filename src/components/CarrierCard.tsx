"use client";

import Link from "next/link";
import { useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";
import { freshness } from "@/lib/freshness";

function initials(brand: string) {
  return brand
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function money(value: number | null | undefined) {
  return value != null ? `$${value}` : "Price varies";
}

function StatusPill({ icon, label, className }: { icon: string; label: string; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-50 px-3 py-2 ring-1 ring-brand-100">
      <dt className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate font-extrabold text-slate-900">{value}</dd>
    </div>
  );
}

export function CarrierCard({
  carrier,
  checkHref = `/check?carrier=${carrier.id}`,
}: {
  carrier: Carrier;
  checkHref?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [fitStatus, setFitStatus] = useState<string>("");
  const [airline, setAirline] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const needsHelp = carrier.verification !== "team_verified" && carrier.verification !== "traveler_reported";

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSubError(null);
    try {
      const res = await fetch("/api/carrier-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierId: carrier.id,
          airlineId: airline || null,
          fitStatus: fitStatus.toLowerCase().replace(/ /g, "_"),
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setSubError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-brand-200/80 bg-white/88 shadow-sm ring-1 ring-white/80">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-extrabold text-caramel">
                {initials(carrier.brand)}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-caramel">{carrier.brand}</span>
            </div>
            <h3 className="mt-1.5 text-base font-extrabold leading-snug text-navy">{carrier.model}</h3>
          </div>
        </div>

        {carrier.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{carrier.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Metric label="Size" value={`${carrier.lengthCm}×${carrier.widthCm}×${carrier.heightCm}`} />
          <Metric label="Empty" value={`${carrier.weightKg} kg`} />
          <Metric label="Pet" value={carrier.maxPetWeightKg ? `${carrier.maxPetWeightKg} kg` : "Varies"} />
        </dl>

        {/* Status badges */}
        {(() => {
          const isVerified = carrier.verification === 'team_verified' || carrier.verification === 'traveler_reported';
          const isReview = carrier.verification === 'needs_review' || carrier.verification === 'failed_check';
          const rules = isVerified
            ? { icon: '✅', label: 'Rules checked', className: 'bg-green-100 text-green-800' }
            : isReview
            ? { icon: '❌', label: 'Needs review', className: 'bg-red-100 text-red-800' }
            : { icon: '⏳', label: 'Awaiting review', className: 'bg-amber-100 text-amber-800' };

          const reportCount = carrier.travelerReports ?? 0;
          const reports = reportCount > 0
            ? { icon: '📊', label: `${reportCount} report${reportCount === 1 ? '' : 's'}`, className: 'bg-green-100 text-green-800' }
            : { icon: '📊', label: 'No reports', className: 'bg-gray-100 text-gray-600' };

          const f = freshness(carrier.verifiedAt).band;
          const freshnessBadge = f === 'fresh'
            ? { icon: '🟢', label: 'Fresh', className: 'bg-green-100 text-green-800' }
            : f === 'aging'
            ? { icon: '🟡', label: 'Aging', className: 'bg-amber-100 text-amber-800' }
            : { icon: '🔴', label: 'Stale', className: 'bg-red-100 text-red-800' };

          return (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <StatusPill {...rules} />
              <StatusPill {...reports} />
              <StatusPill {...freshnessBadge} />
            </div>
          );
        })()}

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>{carrier.softSided ? "Soft-sided" : "Hard-sided"}</span>
          <span>{money(carrier.priceUsd)}</span>
        </div>

        <p className="mt-2 text-[10px] text-slate-400">Price &amp; stock may vary</p>

        {needsHelp && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-1.5 text-left text-[10px] text-slate-400 underline hover:text-brand-700 cursor-pointer"
          >
            Help us verify this carrier
          </button>
        )}

        <div className="mt-auto border-t border-brand-100 pt-4">
          <div className="grid grid-cols-[1.08fr_0.92fr] gap-1 rounded-2xl bg-brand-50 p-1 ring-1 ring-brand-100">
            <Link
              href={checkHref}
              className="primary-cta min-h-10 px-3 py-2 text-sm"
              aria-label={`Check ${carrier.brand} ${carrier.model} against your trip`}
            >
              <span className="cta-icon" aria-hidden="true">⌕</span>
              Check
            </Link>
            <a
              href={trackedClickUrl(carrier.id)}
              rel="nofollow sponsored noopener"
              target="_blank"
              className="secondary-cta min-h-10 px-3 py-2 text-sm"
              title="Affiliate link. We may earn a commission."
              data-click="affiliate-shop"
              data-carrier={carrier.id}
            >
              <span className="cta-icon" aria-hidden="true">↗</span>
              Shop
            </a>
          </div>
        </div>
      </div>
    </article>

      {/* Report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {submitted ? (
              <>
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">✓</div>
                  <h3 className="text-base font-extrabold text-navy">Thanks for reporting!</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    We&apos;ll review your report and update the carrier status.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setSubmitted(false); }}
                    className="primary-cta mt-4 px-4 py-2 text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-navy">Help us verify this carrier</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Have you flown with the <strong>{carrier.brand} {carrier.model}</strong>? Let us know how it went.
                </p>
                <form onSubmit={handleReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Which airline?</label>
                    <input
                      type="text"
                      value={airline}
                      onChange={(e) => setAirline(e.target.value)}
                      placeholder="e.g. Air Canada, United"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Did it fit under the seat?</label>
                    <div className="flex gap-2">
                      {["Yes", "No", "It was tight"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFitStatus(option)}
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                            fitStatus === option
                              ? "border-brand-400 bg-brand-50 text-caramel"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Any notes?</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Model number, aircraft type, how it fit…"
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                    />
                  </div>
                  {subError && (
                    <p className="text-xs text-rose-600">{subError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!airline || !fitStatus || pending}
                    className="primary-cta w-full min-h-10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pending ? "Submitting…" : "Submit report"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}