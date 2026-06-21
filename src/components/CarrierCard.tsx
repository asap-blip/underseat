"use client";

import Link from "next/link";
import { useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";

const verificationBadge: Record<string, { label: string; cls: string }> = {
  team_verified: { label: "✓ Checked by us", cls: "text-emerald-600" },
  traveler_reported: { label: "✈ Traveler reported", cls: "text-amber-600" },
  needs_review: { label: "⏳ Needs review", cls: "text-orange-600" },
  failed_check: { label: "⚠ Failed check", cls: "text-rose-600" },
};

function VerificationBadge({ status }: { status: string }) {
  const badge = verificationBadge[status];
  if (!badge) {
    return (
      <span className="shrink-0 text-[11px] font-medium text-slate-400">🕒 Awaiting review</span>
    );
  }
  if (status === "needs_review") {
    return (
      <span className="shrink-0 text-[11px] font-medium text-orange-600">⏳ Needs verification</span>
    );
  }
  return (
    <span className={`shrink-0 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
  );
}

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

  const needsHelp = carrier.verification !== "team_verified" && carrier.verification !== "traveler_reported";

  function handleReport(e: React.FormEvent) {
    e.preventDefault();
    // No backend yet — log to console for now
    console.log("Carrier report:", {
      carrier: carrier.id,
      airline,
      fitStatus,
      notes,
    });
    setShowModal(false);
    setFitStatus("");
    setAirline("");
    setNotes("");
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
          <VerificationBadge status={carrier.verification} />
        </div>

        {carrier.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{carrier.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Metric label="Size" value={`${carrier.lengthCm}×${carrier.widthCm}×${carrier.heightCm}`} />
          <Metric label="Empty" value={`${carrier.weightKg} kg`} />
          <Metric label="Pet" value={carrier.maxPetWeightKg ? `${carrier.maxPetWeightKg} kg` : "Varies"} />
        </dl>

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
              <button
                type="submit"
                disabled={!airline || !fitStatus}
                className="primary-cta w-full min-h-10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit report
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}