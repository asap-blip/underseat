import { ReverseSearch } from "@/components/ReverseSearch";
import { SuggestCarrier } from "@/components/SuggestCarrier";
import { getRepository } from "@/lib/data/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FindPage() {
  const carriers = await getRepository().listCarriers();
  return (
    <div className="space-y-6">
      <div>
        <span className="section-eyebrow">🐾 Find by pet size</span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Find a pet carrier</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          Enter your pet&apos;s size and we&apos;ll suggest carriers from our carrier list that are
          likely to fit. Then you can check any of them against your flights.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-slate-400">
          We track a small, hand-checked set of carriers rather than every bag on the market. These
          are recommendations, not an exhaustive list.
        </p>
      </div>

      <ReverseSearch carriers={carriers} />

      {/* Example result preview */}
      <section className="soft-panel-muted p-5">
        <h2 className="text-sm font-semibold text-slate-800">See what you get</h2>
        <div className="mt-3 rounded-2xl border border-brand-200 bg-white/90 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">Example: 5 kg Dog</span>
              <div className="mt-1 space-y-1.5 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span><strong>Sherpa</strong> Original Deluxe (Medium) — Likely fits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span><strong>Sleepypod</strong> Atom In-Cabin — Likely fits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">∼</span>
                  <span><strong>SturdiBag</strong> Small — Snug fit</span>
                </div>
              </div>
            </div>
            <Link href="/check?carrier=sherpa-original-md" className="primary-cta shrink-0 px-3 py-1.5 text-xs">
              Try it
            </Link>
          </div>
          <p className="mt-3 text-[10px] text-slate-400">
            Enter your pet&apos;s actual weight above to see real recommendations.
          </p>
        </div>
      </section>

      <SuggestCarrier />
    </div>
  );
}
