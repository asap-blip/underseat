import { CarrierBrowser } from "@/components/CarrierBrowser";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carriers = await getRepository().listCarriers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Carrier catalog</h1>
        <p className="mt-1 text-slate-600">
          Find your bag, then check it against your itinerary. Scan a product code for a quick load.
        </p>
      </div>
      <CarrierBrowser carriers={carriers} />
    </div>
  );
}
