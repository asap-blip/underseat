import { getRepository, dataSourceLabel } from "@/lib/data/repository";
import { RuleEditor } from "@/components/RuleEditor";
import { CarrierEditor } from "@/components/CarrierEditor";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const repo = getRepository();
  const [carriers, airlines, merchants, rules] = await Promise.all([
    repo.listCarriers(),
    repo.listAirlines(),
    repo.listMerchants(),
    repo.listRules(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · data</h1>
          <p className="mt-1 text-slate-600">Development view of seeded carriers, airline rules, and merchants.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/reports" className="text-sm font-medium text-brand-700 hover:underline">
            Traveler reports →
          </a>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            data source: {dataSourceLabel}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Airline rules ({rules.length})</h2>
        <p className="mb-4 text-sm text-slate-500">
          Edit dimensions, weight, soft-sided requirement, the official source, and the verification
          date. Use “Today” after you re-confirm a rule against the airline&apos;s live policy.
        </p>
        <RuleEditor rules={rules} airlines={airlines} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Carriers ({carriers.length})</h2>
        <p className="mb-4 text-sm text-slate-500">
          Edit dimensions, weight, soft-sided flag, verification status, the affiliate URL, and the
          verification date. Use “Today” after you re-measure or re-confirm a bag.
        </p>
        <CarrierEditor carriers={carriers} />
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
