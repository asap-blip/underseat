import { getRepository, dataSourceLabel } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function RefreshStatusPage() {
  const { stale, staleCount } = await getStaleRules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rule freshness</h1>
          <p className="mt-1 text-sm text-slate-600">
            Airline rules that haven&apos;t been verified in over 180 days.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {dataSourceLabel}
        </span>
      </div>

      {dataSourceLabel !== "supabase" && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This page requires Supabase to query `airline_rules`. Configure the Supabase env vars to see live data.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Stale rules ({staleCount})
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Rules where `last_verified_at` is older than 180 days or unset. Visit periodically to see which airlines need re-verification.
        </p>

        {staleCount === 0 ? (
          <p className="text-sm text-emerald-600">All rules are current. ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Airline</th>
                  <th className="px-3 py-2">Cabin</th>
                  <th className="px-3 py-2">Last verified</th>
                  <th className="px-3 py-2">Days ago</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stale.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{r.airlineName}</td>
                    <td className="px-3 py-2 text-slate-600">{r.cabin}</td>
                    <td className="px-3 py-2 text-slate-500">{r.lastVerifiedAt ?? "—"}</td>
                    <td className="px-3 py-2 text-amber-700">{r.daysAgo != null ? `${r.daysAgo}d` : "—"}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-400">
                      {r.sourceLabel ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        To mark a rule as fresh, update its `last_verified_at` date via the database or admin API.
        After re-verification, the rule will automatically drop from this list.
      </p>
    </div>
  );
}

interface StaleRuleRow {
  id: string;
  airlineName: string;
  cabin: string;
  lastVerifiedAt: string | null;
  daysAgo: number | null;
  sourceLabel: string | null;
}

async function getStaleRules(): Promise<{ rules: StaleRuleRow[]; stale: StaleRuleRow[]; staleCount: number }> {
  const repo = getRepository();
  const allRules = await repo.listRules();
  const allAirlines = await repo.listAirlines();
  const airlineMap = new Map(allAirlines.map((a) => [a.id, a.name]));

  const now = Date.now();

  const rules = allRules.map((r) => {
    const daysAgo = r.lastVerifiedAt
      ? Math.floor((now - new Date(r.lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: r.id,
      airlineName: airlineMap.get(r.airlineId) ?? r.airlineId,
      cabin: r.cabin,
      lastVerifiedAt: r.lastVerifiedAt ?? null,
      daysAgo,
      sourceLabel: r.sourceLabel ?? null,
    };
  });

  const stale = rules.filter(
    (r) =>
      r.lastVerifiedAt === null ||
      (r.daysAgo !== null && r.daysAgo > 180),
  );

  return { rules, stale, staleCount: stale.length };
}