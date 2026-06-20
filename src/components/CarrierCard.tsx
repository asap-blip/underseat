"use client";

import Link from "next/link";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";
import { CarrierStatus } from "./CarrierStatus";
import { carrierEvidence } from "@/lib/carrierStatus";

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

function CarrierArtwork({ carrier }: { carrier: Carrier }) {
  if (carrier.imageUrl) {
    return (
      <>
        <img
          src={carrier.imageUrl}
          alt={`${carrier.brand} ${carrier.model}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/45 via-navy/10 to-transparent" />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.72),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(16,35,63,0.10),transparent_36%)]" />
      <div className="absolute inset-x-8 bottom-5 h-16 rounded-[1.4rem] border border-white/70 bg-white/55 shadow-lg shadow-navy/10" />
      <div className="absolute inset-x-12 bottom-8 h-3 rounded-full bg-navy/10" />
      <div className="absolute left-10 top-10 h-8 w-10 rounded-xl border border-white/70 bg-white/60" />
      <div className="absolute right-10 top-11 h-10 w-12 rounded-2xl border border-white/70 bg-white/45" />
      <div className="absolute bottom-12 right-14 h-2 w-2 rounded-full bg-navy/30" />
    </>
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
      <div className="relative h-36 bg-[linear-gradient(135deg,#fff1d8_0%,#f4dfb6_100%)]">
        <CarrierArtwork carrier={carrier} />
        <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/88 text-[11px] font-extrabold text-navy shadow-sm ring-1 ring-white/70">
          {initials(carrier.brand)}
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/88 px-2.5 py-1 text-[11px] font-extrabold text-navy shadow-sm ring-1 ring-white/70">
          {carrier.softSided ? "Soft cabin" : "Hard kennel"}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-caramel">{carrier.brand}</div>
            <h3 className="mt-1 text-base font-extrabold leading-snug text-navy">{carrier.model}</h3>
          </div>
          <CarrierStatus status={carrier.verification} evidence={carrierEvidence(carrier)} carrier={carrier} />
        </div>

        {carrier.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{carrier.description}</p>
        )}

        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Metric label="Size" value={`${carrier.lengthCm}×${carrier.widthCm}×${carrier.heightCm}`} />
          <Metric label="Empty" value={`${carrier.weightKg} kg`} />
          <Metric label="Pet" value={carrier.maxPetWeightKg ? `${carrier.maxPetWeightKg} kg` : "Varies"} />
        </dl>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>{carrier.softSided ? "Soft-sided" : "Hard-sided"}</span>
          <span>{money(carrier.priceUsd)}</span>
        </div>

        <div className="mt-4 grid grid-cols-[1.08fr_0.92fr] gap-1 rounded-2xl bg-brand-50 p-1 ring-1 ring-brand-100">
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
          >
            <span className="cta-icon" aria-hidden="true">↗</span>
            Shop
          </a>
        </div>
      </div>
    </article>
  );
}
