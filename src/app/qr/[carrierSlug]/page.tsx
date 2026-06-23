import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { QrCheckForm } from "@/components/QrCheckForm";

export const dynamic = "force-dynamic";

export default async function QrPage({
  params,
}: {
  params: Promise<{ carrierSlug: string }>;
}) {
  const { carrierSlug } = await params;
  const repo = getRepository();

  const [carrier, airlines] = await Promise.all([
    repo.getCarrier(carrierSlug),
    repo.listAirlines(),
  ]);

  if (!carrier) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg py-6 sm:py-10">
      <QrCheckForm carrier={carrier} airlines={airlines} />
    </div>
  );
}