import Link from "next/link";
import { QuickCheckHero } from "@/components/QuickCheckHero";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const airlines = await getRepository().listAirlines();
  return (
    <div className="space-y-16">
      {/* Hero value prop */}
      <section className="pt-4">
        <h1 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Will this pet carrier fly on your exact itinerary?
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
          Enter your airline and carrier dimensions. We check it against each
          airline&apos;s in-cabin rules and tell you{" "}
          <span className="font-semibold text-emerald-700">PASS</span>,{" "}
          <span className="font-semibold text-amber-700">BORDERLINE</span>, or{" "}
          <span className="font-semibold text-rose-700">NO</span>.
        </p>
      </section>

      {/* Quick check hero — the 3-input form */}
      <QuickCheckHero airlines={airlines} />

      {/* Two paths */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/check" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-500">
          <h2 className="font-semibold text-slate-900">I already have a carrier</h2>
          <p className="mt-2 text-sm text-slate-600">
            Check whether your specific bag fits your flight itinerary, leg by leg, with transparent reasons.
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-brand-700 group-hover:underline">Check compatibility →</span>
        </Link>
        <Link href="/find" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-500">
          <h2 className="font-semibold text-slate-900">I need a carrier</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tell us your pet&apos;s size and we&apos;ll recommend carriers from our curated catalog that are likely to fit — then check them against your trip.
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-brand-700 group-hover:underline">Find a carrier →</span>
        </Link>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            "Pick your carrier or enter its dimensions",
            "Add your pet's species and weight",
            "Enter each flight leg and cabin",
            "Get a clear PASS / BORDERLINE / NO",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust features */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { t: "Leg-by-leg", d: "Multi-airline trip? Each flight is checked against its own cabin rules and an overall verdict is derived." },
          { t: "Transparent reasons", d: "Every result lists structured reason codes — exceeded dimensions, soft-sided rules, missing aircraft data." },
          { t: "Better alternatives", d: "If your bag won't fit, we suggest carriers that will, ranked by fit against your trip — not by payout." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{f.t}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Merchant CTA */}
      <section className="rounded-2xl bg-slate-900 p-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Sell carriers? Embed the check.</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Drop a compatibility checker on your product pages so shoppers know it fits
              their trip before they buy.
            </p>
          </div>
          <Link
            href="/for-merchants"
            className="rounded-lg bg-white px-5 py-2.5 font-medium text-slate-900 hover:bg-slate-100"
          >
            For merchants
          </Link>
        </div>
      </section>
    </div>
  );
}
