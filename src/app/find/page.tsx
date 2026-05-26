import { ReverseSearch } from "@/components/ReverseSearch";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function FindPage() {
  const carriers = await getRepository().listCarriers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Find a carrier for your pet</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          Enter your pet&apos;s size and we&apos;ll suggest carriers from our curated catalog that are
          likely to fit — then you can check any of them against your flights.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-slate-400">
          We track a small, hand-checked set of carriers rather than every bag on the market. These
          are recommendations, not an exhaustive list.
        </p>
      </div>
      <ReverseSearch carriers={carriers} />
    </div>
  );
}
