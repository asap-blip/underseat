import Link from "next/link";
import { getRepository } from "@/lib/data/repository";
import { SourceCitation } from "@/components/SourceCitation";
import { cmToIn } from "@/lib/ui";

export const dynamic = "force-dynamic";

const cabinLabel: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};

function dims(l: number | null, w: number | null, h: number | null): string {
  if (l == null || w == null || h == null) return "Not published";
  return `${l} × ${w} × ${h} cm (${cmToIn(l)} × ${cmToIn(w)} × ${cmToIn(h)} in)`;
}

export default async function AirlineRulesPage({
  params,
}: {
  params: Promise<{ airline: string }>;
}) {
  const { airline: airlineSlug } = await params;
  const repo = getRepository();
  const [airlines, rules] = await Promise.all([repo.listAirlines(), repo.listRules()]);

  const airline = airlines.find((a) => a.id === airlineSlug);
  if (!airline) {
    return (
      <div className="soft-panel p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Airline not found</h1>
        <p className="mt-2 text-slate-600">We don&apos;t have rules for &ldquo;{airlineSlug}&rdquo; yet.</p>
        <Link href="/rules" className="primary-cta mt-4 px-5 py-2.5 font-medium">
          Back to all rules
        </Link>
      </div>
    );
  }

  const airlineRules = rules
    .filter((r) => r.airlineId === airline.id)
    .sort((a, b) => a.cabin.localeCompare(b.cabin));

  if (airlineRules.length === 0) {
    return (
      <div className="soft-panel p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">{airline.name}</h1>
        <p className="mt-2 text-slate-600">No rules on file for this airline yet.</p>
        <Link href="/rules" className="primary-cta mt-4 px-5 py-2.5 font-medium">
          Back to all rules
        </Link>
      </div>
    );
  }

  const lastVerified = airlineRules.reduce((latest, r) => {
    return r.lastVerifiedAt && (!latest || r.lastVerifiedAt > latest) ? r.lastVerifiedAt : latest;
  }, "");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/rules" className="text-sm font-medium text-brand-700 hover:underline">
          ← All airline rules
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {airline.name} <span className="font-mono text-base text-slate-400">{airline.iata}</span>
          </h1>
          {lastVerified && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Last verified: {lastVerified}
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-600">
          Pet carrier in-cabin rules for {airline.name}. Check the source and last-verified date
          before relying on these values for your trip.
        </p>
      </div>

      <div className="space-y-4">
        {airlineRules.map((r) => (
          <section key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {cabinLabel[r.cabin] ?? r.cabin}
              </span>
              {r.aircraftType && (
                <span className="text-xs text-slate-500">Aircraft: {r.aircraftType}</span>
              )}
              {r.aircraftVaries && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Under-seat space varies by aircraft
                </span>
              )}
            </div>

            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <dt className="text-slate-500">Max carrier size</dt>
                <dd className="text-slate-900">{dims(r.maxLengthCm, r.maxWidthCm, r.maxHeightCm)}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-slate-500">Max pet + carrier weight</dt>
                <dd className="text-slate-900">
                  {r.maxCombinedWeightKg != null ? `${r.maxCombinedWeightKg} kg` : "Not published"}
                </dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-slate-500">Soft-sided</dt>
                <dd className="text-slate-900 capitalize">{r.softSidedRequirement ?? "Either allowed"}</dd>
              </div>
            </dl>

            {r.notes && <p className="mt-3 text-sm text-slate-600">{r.notes}</p>}

            <div className="mt-3 border-t border-slate-100 pt-3">
              <SourceCitation
                sourceUrl={r.sourceUrl}
                sourceLabel={r.sourceLabel}
                sourceType={r.sourceType}
                lastVerifiedAt={r.lastVerifiedAt}
              />
            </div>
          </section>
        ))}
      </div>

      <Link
        href={`/check`}
        className="primary-cta mt-3 inline-flex px-5 py-2.5 text-sm"
      >
        <span aria-hidden="true">⌕</span>
        Check a carrier against {airline.name}
      </Link>
    </div>
  );
}