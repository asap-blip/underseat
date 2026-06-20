import Link from "next/link";
import { QuickCheckHero } from "@/components/QuickCheckHero";
import { getRepository } from "@/lib/data/repository";
import { CarrierCard } from "@/components/CarrierCard";
import type { Carrier } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const howItWorks = [
  {
    step: "1",
    title: "Enter trip",
    copy: "Pick the airline, cabin, pet weight, and carrier size you are planning to fly with.",
  },
  {
    step: "2",
    title: "Compare rules",
    copy: "Each leg is checked against airline and cabin-specific pet carrier limits.",
  },
  {
    step: "3",
    title: "Get verdict",
    copy: "You get Pass, Tight fit, or No with clear reasons you can act on.",
  },
];

const faqs = [
  {
    q: "Does this guarantee my pet carrier will be accepted?",
    a: "No. Underseat is a compatibility checker, not a guarantee. Airlines make the final decision at check-in or the gate, so confirm current policy before you travel.",
  },
  {
    q: "Does Checked by us mean the airline approved it?",
    a: "No. Checked by us means Underseat manually reviewed the carrier details against the airline rules we have on file. It is not airline approval, and the airline still makes the final decision.",
  },
  {
    q: "Why do multi-leg trips matter?",
    a: "Each airline can use different under-seat dimensions, weight limits, and cabin rules. We check each leg separately so a carrier that fits one flight is not assumed to fit the next.",
  },
  {
    q: "What does Tight fit mean?",
    a: "Tight fit means the carrier is close to a limit, uses incomplete data, or depends on factors like aircraft type. It is worth double-checking before you fly.",
  },
  {
    q: "Can I use this if I do not own a carrier yet?",
    a: "Yes. Use Find to compare likely-fit options, then run a promising bag through a trip check before you buy.",
  },
];

const recommendedCarrierIds = [
  "sherpa-original-md",
  "sleepypod-air",
  "sturdibag-small",
  "diggs-passenger",
  "away-pet-carrier",
  "petami-classic-sm",
];

function pickRecommended(carriers: Carrier[]) {
  const byId = new Map(carriers.map((carrier) => [carrier.id, carrier]));
  return recommendedCarrierIds
    .map((id) => byId.get(id))
    .filter((carrier): carrier is Carrier => Boolean(carrier))
    .slice(0, 4);
}

export default async function HomePage() {
  const repo = getRepository();
  const [airlines, carriers] = await Promise.all([repo.listAirlines(), repo.listCarriers()]);
  const recommended = pickRecommended(carriers);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-200/70 bg-[linear-gradient(135deg,#fffaf1_0%,#fff0d6_100%)] p-3 shadow-2xl shadow-brand-700/10 sm:p-4 lg:p-5">
        <div className="absolute -left-20 top-0 h-48 w-48 rounded-full bg-honey-100/70 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />

        <div className="relative grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex flex-col py-0">
            <span className="section-eyebrow">
              <span aria-hidden="true">✈</span> Pet air travel check
            </span>
            <h1 className="mt-3 max-w-3xl text-left text-4xl font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Can your pet ride on this flight with this carrier?
            </h1>
            <p className="mt-3 max-w-2xl text-left text-base leading-8 text-slate-700 sm:text-lg">
              Check a real itinerary before you book. Underseat compares your carrier against airline and
              cabin rules, then gives you Pass, Tight fit, or No with clear reasons.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/check" className="primary-cta px-6 py-3 text-base">
                <span className="cta-icon" aria-hidden="true">⌕</span>
                Check
              </Link>
              <Link href="/find" className="secondary-cta px-6 py-3 text-base">
                <span className="cta-icon" aria-hidden="true">↗</span>
                Find
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white/75 px-3 py-2 ring-1 ring-brand-200/70">
                Leg by leg
              </span>
              <span className="rounded-full bg-white/75 px-3 py-2 ring-1 ring-brand-200/70">
                By cabin
              </span>
              <span className="rounded-full bg-white/75 px-3 py-2 ring-1 ring-brand-200/70">
                Pass / Tight fit / No
              </span>
            </div>
          </div>

          <div className="rounded-[1.55rem] bg-cream/95 p-2.5 shadow-xl shadow-navy/10 ring-1 ring-white/80 sm:p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-extrabold tracking-tight text-navy">Trip check</div>
                <div className="text-xs text-slate-500">Airline · cabin · carrier size</div>
              </div>
            </div>
            <QuickCheckHero airlines={airlines} />
          </div>
        </div>
      </section>

      {/* Recommended carriers */}
      <section className="soft-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-eyebrow">
              <span aria-hidden="true">🐾</span> Recommended carriers
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-navy">
              Carriers worth checking.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Fit-first picks from the carriers we track. Check one against your trip, or shop it if you
              are still choosing a bag.
            </p>
          </div>
          <Link href="/carriers" className="ghost-cta rounded-full px-4 py-2 text-sm">
            <span aria-hidden="true">↗</span>
            Shop
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommended.map((carrier) => (
            <CarrierCard key={carrier.id} carrier={carrier} />
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-500">
          Shop links are affiliate links. We recommend carriers by fit and airline rules first.
        </p>
      </section>

      {/* How it works */}
      <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div className="soft-panel-muted p-6">
          <span className="section-eyebrow">
            <span aria-hidden="true">🧭</span> How it works
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-navy">
            A quick check before you book.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Give us the trip details. We handle the rule comparison and explain the result in plain language.
          </p>
        </div>

        <div className="grid gap-4">
          {howItWorks.map((item) => (
            <div key={item.step} className="soft-panel p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-extrabold text-caramel">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-navy">{item.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{item.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="soft-panel p-5 sm:p-6">
        <div className="max-w-2xl">
          <span className="section-eyebrow">
            <span aria-hidden="true">❓</span> Quick answers
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-navy">
            Questions before you check?
          </h2>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-3xl border border-brand-200/80 bg-white/82 p-5">
              <summary className="cursor-pointer list-none text-sm font-extrabold text-navy">
                {item.q}
                <span className="ml-2 text-caramel transition group-open:rotate-90" aria-hidden="true">
                  ›
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
