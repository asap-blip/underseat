import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="pt-8 text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          One question, answered honestly
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Will this pet carrier fly on your exact itinerary?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Enter your carrier and your flights. We check it leg by leg against each
          airline&apos;s in-cabin rules and tell you{" "}
          <span className="font-semibold text-emerald-700">PASS</span>,{" "}
          <span className="font-semibold text-amber-700">BORDERLINE</span>, or{" "}
          <span className="font-semibold text-rose-700">NO</span> — with the reasons.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/check"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            Check my carrier
          </Link>
          <Link
            href="/carriers"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse carriers
          </Link>
        </div>
      </section>

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

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            "Pick your carrier or scan its code",
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

      <section className="rounded-2xl bg-slate-900 p-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Sell carriers? Embed the check.</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Drop a compatibility checker on your product pages so shoppers know it fits
              their trip before they buy. See the merchant demo.
            </p>
          </div>
          <Link
            href="/merchant/petgearco"
            className="rounded-lg bg-white px-5 py-2.5 font-medium text-slate-900 hover:bg-slate-100"
          >
            View merchant demo
          </Link>
        </div>
      </section>
    </div>
  );
}
