import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckWidget } from "@/components/CheckWidget";
import { getRepository } from "@/lib/data/repository";
import { buildCoverageMap } from "@/lib/coverage";

export const dynamic = "force-dynamic";

export default async function MerchantDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getRepository();
  const merchant = await repo.getMerchantBySlug(slug);
  if (!merchant) notFound();

  const [products, airlines, rules] = await Promise.all([
    repo.listMerchantProducts(merchant.id),
    repo.listAirlines(),
    repo.listRules(),
  ]);
  const coverage = buildCoverageMap(airlines, rules);

  const withCarriers = await Promise.all(
    products.map(async (p) => ({ product: p, carrier: await repo.getCarrier(p.carrierId) })),
  );
  const featured = withCarriers.find((x) => x.carrier);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        <strong className="text-slate-800">Merchant demo.</strong> This page simulates a retailer&apos;s
        product page with the Underseat checker embedded. The widget calls the same{" "}
        <code className="rounded bg-white px-1">/api/check</code> contract a real embed would use.
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{merchant.name}</h1>
        <p className="mt-1 text-slate-600">Product catalog with embedded in-cabin compatibility checks.</p>
      </div>

      {featured?.carrier && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="soft-panel p-6">
            <div className="text-sm font-medium text-slate-500">{featured.carrier.brand}</div>
            <h2 className="text-xl font-semibold text-slate-900">{featured.carrier.model}</h2>
            <p className="mt-2 text-sm text-slate-600">{featured.carrier.description}</p>
            <dl className="mt-4 space-y-1 text-sm text-slate-600">
              <div>Dimensions: {featured.carrier.lengthCm} × {featured.carrier.widthCm} × {featured.carrier.heightCm} cm</div>
              <div>{featured.carrier.softSided ? "Soft-sided" : "Hard-sided"} · {featured.carrier.weightKg} kg empty</div>
              {featured.carrier.priceUsd != null && <div className="text-lg font-semibold text-slate-900">${featured.carrier.priceUsd}</div>}
            </dl>
            <div className="mt-4 text-xs text-slate-400">External product id: {featured.product.externalProductId}</div>
          </div>
          <CheckWidget
            carrierId={featured.carrier.id}
            carrierLabel={`${featured.carrier.brand} ${featured.carrier.model}`}
            airlines={airlines}
            coverage={coverage}
          />
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold text-slate-900">More from {merchant.name}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withCarriers
            .filter((x) => x.carrier && x.carrier.id !== featured?.carrier?.id)
            .map(({ product, carrier }) => (
              <div key={product.id} className="rounded-2xl border border-slate-200 bg-white/90 p-5">
                <div className="text-sm font-medium text-slate-500">{carrier!.brand}</div>
                <div className="font-semibold text-slate-900">{carrier!.model}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {carrier!.lengthCm} × {carrier!.widthCm} × {carrier!.heightCm} cm
                </div>
                <Link
                  href={`/check?carrier=${carrier!.id}`}
                  className="mt-3 inline-block rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                >
                  Check
                </Link>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
