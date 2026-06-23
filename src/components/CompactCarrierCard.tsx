"use client";

import Link from "next/link";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

function reportBadge(travelerReports: number | null | undefined) {
  if (travelerReports && travelerReports > 0) {
    return { icon: "📊", label: `${travelerReports} report${travelerReports === 1 ? "" : "s"}`, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }
  return { icon: "🔄", label: "No reports yet", cls: "bg-slate-50 text-slate-400 ring-slate-100" };
}

// ─── Badge component (reusable pill) ───────────────────────────────────────

function Badge({ icon, label, cls }: { icon: string; label: string; cls: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      <span aria-hidden="true" className="text-[13px]">{icon}</span>
      {label}
    </span>
  );
}

// ─── Metric chip ───────────────────────────────────────────────────────────

function Chip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50/70 px-2.5 py-1 text-[12px] font-semibold text-slate-700 ring-1 ring-brand-100/60">
      <span aria-hidden="true" className="text-[14px]">{icon}</span>
      <span className="sr-only">{label}: </span>
      {value}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function CompactCarrierCard({
  carrier,
  checkHref = `/check?carrier=${carrier.id}`,
}: {
  carrier: Carrier;
  checkHref?: string;
}) {
  const report = reportBadge(carrier.travelerReports);

  return (
    <article className="group flex flex-col rounded-xl border border-brand-200/70 bg-white shadow-sm ring-1 ring-white/80 transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        {/* ── Brand + name row ── */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100 text-[10px] font-extrabold text-caramel">
            {initials(carrier.brand)}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-caramel">{carrier.brand}</span>
            <h3 className="truncate text-sm font-extrabold leading-tight text-navy">{carrier.model}</h3>
          </div>
        </div>

        {/* ── Metrics row 1: weight + pet capacity ── */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip icon="⚖️" label="Empty weight" value={`${carrier.weightKg} kg`} />
          <Chip icon="🐾" label="Max pet weight" value={carrier.maxPetWeightKg ? `${carrier.maxPetWeightKg} kg` : "Varies"} />
          <Chip icon="📐" label="Dimensions" value={`${carrier.lengthCm}×${carrier.widthCm}×${carrier.heightCm} cm`} />
        </div>

        {/* ── Metrics row 2: reports badge + type ── */}
        <div className="flex items-center gap-1.5">
          <Badge icon={report.icon} label={report.label} cls={report.cls} />
          <span className="text-[11px] font-medium text-slate-400">
            {carrier.softSided ? "Soft-sided" : "Hard-sided"}
          </span>
        </div>

        {/* ── CTA row: price + Shop ── */}
        <div className="mt-auto flex items-center justify-between border-t border-brand-100/60 pt-3">
          <span className="text-xl font-extrabold text-navy">{money(carrier.priceUsd)}</span>
          <div className="flex gap-1.5">
            <Link
              href={checkHref}
              className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3.5 py-1.5 text-[12px] font-extrabold text-caramel transition-colors hover:bg-brand-200"
              aria-label={`Check ${carrier.brand} ${carrier.model} against your trip`}
            >
              <span aria-hidden="true" className="text-sm">⌕</span>
              Check
            </Link>
            <a
              href={trackedClickUrl(carrier.id)}
              rel="nofollow sponsored noopener"
              target="_blank"
              className="primary-cta min-h-0 gap-1 px-3.5 py-1.5 text-[12px] font-extrabold shadow-sm"
              title="Affiliate link. We may earn a commission."
              data-click="affiliate-shop"
              data-carrier={carrier.id}
            >
              Shop
              <span aria-hidden="true" className="text-sm">↗</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}