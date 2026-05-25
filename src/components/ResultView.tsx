import type { CheckResponse } from "@/lib/check/service";
import { VerdictBadge } from "./VerdictBadge";
import { DimensionTable } from "./DimensionTable";
import { ReasonList } from "./ReasonList";
import { AlternativesPanel } from "./AlternativesPanel";
import { ShareLink } from "./ShareLink";
import { confidenceLabel, verdictHeadline } from "@/lib/ui";

export function ResultView({
  response,
  shareToken,
  showShare = true,
}: {
  response: CheckResponse;
  shareToken?: string;
  showShare?: boolean;
}) {
  const { carrier, result, alternatives } = response;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">{carrier.brand}</div>
            <h1 className="text-2xl font-semibold text-slate-900">{carrier.model}</h1>
            <p className="mt-1 text-slate-600">{verdictHeadline(result.overall)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <VerdictBadge verdict={result.overall} size="lg" />
            <span className="text-xs text-slate-500">{confidenceLabel[result.confidence]}</span>
          </div>
        </div>
        {showShare && (
          <div className="mt-4 flex items-center gap-2">
            <ShareLink />
            <span className="text-xs text-slate-400">This result is recomputed from the itinerary in the link.</span>
          </div>
        )}
      </section>

      <div className="space-y-4">
        {result.legs.map((leg) => (
          <section key={leg.legIndex} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Leg {leg.legIndex + 1}</div>
                <div className="font-semibold text-slate-900">
                  {leg.origin} → {leg.destination}
                </div>
                <div className="text-sm text-slate-500">
                  {leg.airlineName} · {leg.cabin.replace("_", " ")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <VerdictBadge verdict={leg.verdict} />
                <span className="text-xs text-slate-500">{confidenceLabel[leg.confidence]}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Size comparison</h3>
                <DimensionTable rows={leg.comparison} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Why this result</h3>
                <ReasonList reasons={leg.reasons} />
              </div>
            </div>

            {leg.ruleSnapshot?.sourceUrl && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Rule source:{" "}
                <a href={leg.ruleSnapshot.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {new URL(leg.ruleSnapshot.sourceUrl).hostname}
                </a>
                {leg.ruleSnapshot.lastVerifiedAt && <> · last verified {leg.ruleSnapshot.lastVerifiedAt}</>}
              </div>
            )}
          </section>
        ))}
      </div>

      <AlternativesPanel
        alternatives={alternatives}
        checkToken={shareToken}
        heading={result.overall === "PASS" ? "Other carriers that also fit" : "Better-fit alternatives"}
      />
    </div>
  );
}
