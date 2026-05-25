import { getRepository, dataSourceLabel } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const repo = getRepository();
  const [carriers, airlines, merchants] = await Promise.all([
    repo.listCarriers(),
    repo.listAirlines(),
    repo.listMerchants(),
  ]);
  const rules = await Promise.all(
    airlines.map(async (a) => ({ airline: a, rule: await repo.getRule(a.id, "economy") })),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · data</h1>
          <p className="mt-1 text-slate-600">Development view of seeded carriers, airline rules, and merchants.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          data source: {dataSourceLabel}
        </span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Airline rules ({rules.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Airline</th>
                <th className="py-2 pr-4">Max L×W×H (cm)</th>
                <th className="py-2 pr-4">Max wt (kg)</th>
                <th className="py-2 pr-4">Soft-sided</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map(({ airline, rule }) => (
                <tr key={airline.id}>
                  <td className="py-2 pr-4 font-medium text-slate-800">{airline.name}</td>
                  <td className="py-2 pr-4">
                    {rule && rule.maxLengthCm != null
                      ? `${rule.maxLengthCm} × ${rule.maxWidthCm} × ${rule.maxHeightCm}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">{rule?.maxCombinedWeightKg ?? "—"}</td>
                  <td className="py-2 pr-4">{rule?.softSidedRequirement ?? "—"}</td>
                  <td className="py-2 pr-4">{rule?.lastVerifiedAt ?? "—"}</td>
                  <td className="py-2 max-w-[14rem] truncate">
                    {rule?.sourceUrl ? (
                      <a className="text-brand-700 underline" href={rule.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {new URL(rule.sourceUrl).hostname}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Carriers ({carriers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Brand / model</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">L×W×H (cm)</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Affiliate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carriers.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4 font-medium text-slate-800">{c.brand} {c.model}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{c.sku}</td>
                  <td className="py-2 pr-4">{c.lengthCm}×{c.widthCm}×{c.heightCm}</td>
                  <td className="py-2 pr-4">{c.softSided ? "soft" : "hard"}</td>
                  <td className="py-2 pr-4">{c.verification}</td>
                  <td className="py-2">{c.affiliateUrl ? "set" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Merchants ({merchants.length})</h2>
        <ul className="space-y-1 text-sm text-slate-700">
          {merchants.map((m) => (
            <li key={m.id}>
              {m.name} · <span className="text-slate-400">/merchant/{m.slug}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        To edit data in development, update <code>src/lib/data/seed.ts</code> (canonical) and re-run{" "}
        <code>npm run seed:sql</code> to regenerate the Supabase seed. With Supabase configured, manage rows
        directly in the Supabase dashboard.
      </p>
    </div>
  );
}
