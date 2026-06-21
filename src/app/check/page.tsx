import Link from "next/link";
import { CheckForm } from "@/components/CheckForm";
import { getRepository } from "@/lib/data/repository";
import { buildCoverageMap } from "@/lib/coverage";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ carrier?: string; airline?: string; cabin?: string; petWeight?: string; petLength?: string; petHeight?: string }>;
}) {
  const { carrier, airline, cabin, petWeight, petLength, petHeight } = await searchParams;
  const repo = getRepository();
  const [airlines, carriers, rules] = await Promise.all([
    repo.listAirlines(),
    repo.listCarriers(),
    repo.listRules(),
  ]);
  const coverage = buildCoverageMap(airlines, rules);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Trip check" },
      ]} />
      <div>
        <Link href="/carriers" className="text-xs text-slate-400 hover:text-brand-700 transition-colors">
          ← Back to carriers
        </Link>
        <span className="section-eyebrow">✈ Trip check</span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Check your trip</h1>
        <p className="mt-1 text-slate-600">
          Tell us the carrier, your pet, and each flight leg. We&apos;ll return a verdict per leg and overall.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          We currently cover {airlines.length} airlines across Economy, Premium Economy, Business, and First Class. Some cabins are cloned from Economy with an unverified fallback note when no separate cabin rule is published. Routes are not individually validated.{" "}
          <Link href="/rules" className="text-brand-700 underline">See the supported-airlines list</Link>.
        </p>
      </div>
      <CheckForm
        airlines={airlines}
        carriers={carriers}
        coverage={coverage}
        initialCarrierId={carrier}
        initialAirlineId={airline}
        initialCabin={cabin}
        initialPetWeight={petWeight ? Number(petWeight) : undefined}
        initialPetLength={petLength ? Number(petLength) : undefined}
        initialPetHeight={petHeight ? Number(petHeight) : undefined}
      />
    </div>
  );
}
