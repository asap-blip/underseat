import type { CheckResponse } from "@/lib/check/service";
import { VerdictBadge } from "./VerdictBadge";
import { DimensionTable } from "./DimensionTable";
import { WhyResult } from "./WhyResult";
import { ConfidenceBadge, ConfidenceReasons } from "./ConfidenceBadge";
import { AlternativesPanel } from "./AlternativesPanel";
import { ShareLink } from "./ShareLink";
import { SourceCitation } from "./SourceCitation";
import { CarrierStatus } from "./CarrierStatus";
import { VerdictHelp } from "./Help";
import { TripFollowupForm } from "./TripFollowupForm";
import { SaveCheckForm } from "./SaveCheckForm";
import { verdictHeadline } from "@/lib/ui";

export function ResultView({
  response,
  shareToken,
  showShare = true,
}: {
  response: CheckResponse;
  shareToken?: string;
  showShare?: boolean;
}) {
  const { carrier, result, alternatives, warnings, legStatuses } = response;
  const multiLeg = result.legs.length > 1;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-500">{carrier.brand}</div>
            <h1 className="text-2xl font-semibold text-slate-900">{carrier.model}</h1>
            <p className="mt-1 text-slate-600">
              {multiLeg ? "Overall itinerary verdict — " : ""}
              {verdictHeadline(result.overall)}
            </p>
            {multiLeg && (
              <p className="mt-1 text-xs text-slate-400">
                Overall reflects the worst leg across {result.legs.length} legs.
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <VerdictBadge verdict={result.overall} size="lg" />
            <ConfidenceBadge confidence={result.confidence} />
          </div>
        </div>
        <ConfidenceReasons confidence={result.confidence} reasons={result.confidenceReasons} />
        <VerdictHelp />
        {showShare && (
          <div className="mt-4 flex items-center gap-2">
            <ShareLink />
            <span className="text-xs text-slate-400">This result is recomputed from the itinerary in the link.</span>
          </div>
        )}
      </section>

      {warnings.length > 0 && (
        <section className="space-y-2">
          {warnings.map((w) => (
            <div
              key={w.code}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {w.message}
            </div>
          ))}
        </section>
      )}

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
                  Evaluated against <span className="font-medium text-slate-700">{leg.airlineName}</span> ·{" "}
                  {leg.cabin.replace("_", " ")}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {leg.operatingUnknown && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                      Operating airline not modeled · indicative only
                    </span>
                  )}
                  {leg.operatingOverride && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                      Operating carrier used (booked {leg.bookingAirlineName})
                    </span>
                  )}
                  {leg.codeshare && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                      Possible codeshare
                    </span>
                  )}
                  {!leg.cabinModeled && leg.ruleSnapshot && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Cabin not modeled · used {leg.ruleSnapshot.cabin}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <VerdictBadge verdict={leg.verdict} />
                <ConfidenceBadge confidence={leg.confidence} />
                {legStatuses[leg.legIndex] && (
                  <CarrierStatus
                    status={legStatuses[leg.legIndex].status}
                    evidence={legStatuses[leg.legIndex].evidence}
                  />
                )}
              </div>
            </div>

            <ConfidenceReasons confidence={leg.confidence} reasons={leg.confidenceReasons} />

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Size comparison</h3>
                <DimensionTable rows={leg.comparison} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Why this result</h3>
                <WhyResult verdict={leg.verdict} reasons={leg.reasons} />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              {leg.ruleSnapshot ? (
                <>
                  <SourceCitation
                    sourceUrl={leg.ruleSnapshot.sourceUrl}
                    sourceLabel={leg.ruleSnapshot.sourceLabel}
                    sourceType={leg.ruleSnapshot.sourceType}
                    lastVerifiedAt={leg.ruleSnapshot.lastVerifiedAt}
                    compact
                  />
                  {leg.ruleSnapshot.notes && (
                    <p className="mt-1 text-xs text-slate-400">{leg.ruleSnapshot.notes}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  No published rule was found for this airline/cabin, so this verdict is based on
                  incomplete data.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>

      <AlternativesPanel
        alternatives={alternatives}
        checkToken={shareToken}
        heading={result.overall === "PASS" ? "Other carriers that also fit" : "Better-fit alternatives"}
      />

      <SaveCheckForm
        shareToken={shareToken}
        carrierId={carrier.id}
        airlineId={result.legs[0]?.bookingAirlineId}
        overallStatus={result.overall}
        routeText={result.legs.map((l) => `${l.origin}→${l.destination}`).join(", ")}
      />

      <TripFollowupForm
        carrierId={carrier.id}
        airlineId={result.legs[0]?.bookingAirlineId}
        routeText={result.legs.map((l) => `${l.origin}→${l.destination}`).join(", ")}
      />
    </div>
  );
}
