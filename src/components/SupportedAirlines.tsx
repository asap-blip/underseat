import type { Airline, AirlineRule } from "@/lib/data/types";
import { FreshnessBadge } from "./SourceCitation";

const cabinLabel: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};

export interface AirlineCoverage {
  airline: Airline;
  cabins: string[];
  hasDimensions: boolean;
  sourceUrl: string | null;
  sourceLabel: string | null;
  lastVerifiedAt: string | null;
}

export function buildCoverage(airlines: Airline[], rules: AirlineRule[]): AirlineCoverage[] {
  return airlines
    .map((airline) => {
      const own = rules.filter((r) => r.airlineId === airline.id);
      if (own.length === 0) return null;
      // Prefer the economy rule as the representative source; fall back to first.
      const primary = own.find((r) => r.cabin === "economy") ?? own[0];
      const coverage: AirlineCoverage = {
        airline,
        cabins: [...new Set(own.map((r) => r.cabin as string))],
        hasDimensions: own.some((r) => r.maxLengthCm != null),
        sourceUrl: primary.sourceUrl ?? null,
        sourceLabel: primary.sourceLabel ?? null,
        lastVerifiedAt: primary.lastVerifiedAt ?? null,
      };
      return coverage;
    })
    .filter((c): c is AirlineCoverage => c !== null);
}

// Honest, visible coverage list. Does NOT imply full airline coverage: it shows
// exactly which airlines/cabins have a rule, and flags incomplete data.
export function SupportedAirlines({ coverage }: { coverage: AirlineCoverage[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Supported airlines ({coverage.length})
        </h2>
        <span className="text-xs text-slate-500">All cabin classes shown</span>
      </div>

      <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This is our full current coverage. Not every airline, cabin, aircraft, or route is modeled. Verdicts depend on
        the airline and cabin you choose. Cabins marked as fallback use the Economy rule with an
        unverified cabin-specific note.
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4">Airline</th>
              <th className="py-2 pr-4">Cabins covered</th>
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2">Last verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coverage.map((c) => (
              <tr key={c.airline.id}>
                <td className="py-2 pr-4 font-medium text-slate-800">
                  {c.airline.name} <span className="font-mono text-xs text-slate-400">{c.airline.iata}</span>
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {c.cabins.map((cab) => cabinLabel[cab] ?? cab).join(", ")}
                </td>
                <td className="py-2 pr-4">
                  {c.hasDimensions ? (
                    <span className="text-emerald-700">Dimensions on file</span>
                  ) : (
                    <span className="text-amber-700">No published dimensions</span>
                  )}
                </td>
                <td className="py-2 pr-4 max-w-[16rem] truncate">
                  {c.sourceUrl ? (
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                      {c.sourceLabel ?? new URL(c.sourceUrl).hostname.replace(/^www\./, "")}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{c.lastVerifiedAt ?? "—"}</span>
                    <FreshnessBadge lastVerifiedAt={c.lastVerifiedAt} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
