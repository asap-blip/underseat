"use client";

import Link from "next/link";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";

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
  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-brand-200/80 bg-white/88 shadow-sm ring-1 ring-white/80">
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
          {carrier.verification === "team_verified" && (
            <span className="shrink-0 text-[11px] font-medium text-emerald-600">Checked by us</span>
          )}
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

        <div className="mt-5 grid grid-cols-[1.08fr_0.92fr] gap-1 rounded-2xl bg-brand-50 p-1 ring-1 ring-brand-100">
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
    </article>
  );
}
