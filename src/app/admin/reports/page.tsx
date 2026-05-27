import Link from "next/link";
import { ReportModerator } from "@/components/ReportModerator";
import { getRepository, dataSourceLabel } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const repo = getRepository();
  const reports = await repo.listTravelerReports("needs_review");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · traveler reports</h1>
          <p className="mt-1 text-slate-600">
            Review crowdsourced reports. Approving one folds it into that carrier-airline&apos;s
            verification (counts, confidence, status).
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          data source: {dataSourceLabel}
        </span>
      </div>

      {dataSourceLabel !== "supabase" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Traveler reports live in Supabase. Configure the Supabase env vars to moderate real reports.
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Awaiting review ({reports.length})</h2>
        <ReportModerator reports={reports} />
      </section>

      <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to admin
      </Link>
    </div>
  );
}
