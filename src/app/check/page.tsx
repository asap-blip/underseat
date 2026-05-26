import Link from "next/link";
import { CheckForm } from "@/components/CheckForm";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ carrier?: string }>;
}) {
  const { carrier } = await searchParams;
  const repo = getRepository();
  const [airlines, carriers] = await Promise.all([
    repo.listAirlines(),
    repo.listCarriers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Check your trip</h1>
        <p className="mt-1 text-slate-600">
          Tell us the carrier, your pet, and each flight leg. We&apos;ll return a verdict per leg and overall.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          We currently cover {airlines.length} airlines (economy cabin). Other cabins fall back to the
          economy rule, and routes are not individually validated.{" "}
          <Link href="/rules" className="text-brand-700 underline">See the supported-airlines list</Link>.
        </p>
      </div>
      <CheckForm airlines={airlines} carriers={carriers} initialCarrierId={carrier} />
    </div>
  );
}
