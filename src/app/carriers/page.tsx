import Link from "next/link";
import { CarrierBrowser } from "@/components/CarrierBrowser";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carriers = await getRepository().listCarriers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Curated carrier catalog</h1>
        <p className="mt-1 text-slate-600">
          A small, hand-checked set of carriers we track and keep dimensions for — not every bag on
          the market. Find yours and check it against your itinerary, or scan a product code.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Not sure which to pick?{" "}
          <Link href="/find" className="text-brand-700 underline">Tell us your pet&apos;s size</Link> and
          we&apos;ll recommend matches. Shop links are affiliate links.
        </p>
      </div>
      <CarrierBrowser carriers={carriers} />
    </div>
  );
}
