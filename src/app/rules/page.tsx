import { getRepository } from "@/lib/data/repository";
import { SourceCitation } from "@/components/SourceCitation";
import { SupportedAirlines, buildCoverage } from "@/components/SupportedAirlines";
import { RequestAirline } from "@/components/RequestAirline";
import { CHANGELOG, rulesLastUpdated } from "@/lib/changelog";
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

export default async function RulesPage() {
  const repo = getRepository();
  const [airlines, rules] = await Promise.all([repo.listAirlines(), repo.listRules()]);

  const coverage = buildCoverage(airlines, rules);
  const lastUpdated = rulesLastUpdated(rules);

  const byAirline = airlines
    .map((airline) => ({
      airline,
      rules: rules
        .filter((r) => r.airlineId === airline.id)
        .sort((a, b) => a.cabin.localeCompare(b.cabin)),
    }))
    .filter((g) => g.rules.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Airline pet rules</h1>
          {lastUpdated && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Rules last updated {lastUpdated}
            </span>
          )}
        </div>
        <p className="mt-1 max-w-2xl text-slate-600">
          Every in-cabin rule we check against, with the official source it came from, the source
          type, and when it was last verified. We show our work so you can confirm it yourself.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-slate-400">
          Values are illustrative until independently re-verified. Airlines can change policy at any
          time and make the final acceptance decision at the gate.
        </p>
      </div>

      <SupportedAirlines coverage={coverage} />

      <RequestAirline />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Recent rule updates</h2>
        <ul className="mt-3 space-y-2">
          {CHANGELOG.map((e, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-slate-400">{e.date}</span>
              <span className="text-slate-700">{e.summary}</span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="pt-2 text-lg font-semibold text-slate-900">Full rule details</h2>
      <div className="space-y-6">
        {byAirline.map(({ airline, rules }) => (
          <section key={airline.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{airline.name}</h2>
              <span className="text-xs font-mono text-slate-400">{airline.iata}</span>
            </div>
            <div className="mt-4 space-y-4">
              {rules.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
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
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
