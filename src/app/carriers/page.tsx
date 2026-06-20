import Link from "next/link";
import { CarrierBrowser } from "@/components/CarrierBrowser";
import { SuggestCarrier } from "@/components/SuggestCarrier";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carriers = await getRepository().listCarriers();
  return (
    <div className="space-y-6">
      <div>
        <span className="section-eyebrow">🧳 Shop carriers</span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Shop pet carriers</h1>
        <p className="mt-1 text-slate-600">
          Browse the carriers we track, compare fit details, and check any bag against your itinerary before you buy.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Not sure which to pick?{" "}
          <Link href="/find" className="text-brand-700 underline">Find by pet size</Link> and
          we&apos;ll recommend matches. Shop links are affiliate links.
        </p>
      </div>
      <CarrierBrowser carriers={carriers} />
      <SuggestCarrier />
    </div>
  );
}
