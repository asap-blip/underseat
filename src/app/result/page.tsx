import Link from "next/link";
import { ResultView } from "@/components/ResultView";
import { checkInputSchema } from "@/lib/validation/schemas";
import { decodeCheck, runCheck } from "@/lib/check/service";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const decoded = d ? decodeCheck(d) : null;
  const parsed = decoded ? checkInputSchema.safeParse(decoded) : null;

  if (!parsed || !parsed.success) {
    return (
      <div className="soft-panel p-8 text-center space-y-6">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Result" },
        ]} />
        <h1 className="text-xl font-semibold text-slate-900">We couldn&apos;t read that result link</h1>
        <p className="mt-2 text-slate-600">The link may be incomplete or out of date.</p>
        <Link href="/check" className="primary-cta mt-4 px-5 py-2.5 font-medium">
          Run a new check
        </Link>
      </div>
    );
  }

  let response;
  try {
    response = await runCheck(parsed.data, { persist: false });
  } catch {
    return (
      <div className="soft-panel p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">That carrier is no longer available</h1>
        <Link href="/check" className="primary-cta mt-4 px-5 py-2.5 font-medium">
          Run a new check
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Result" },
      ]} />
      <ResultView response={response} shareToken={d} />
      <div className="flex justify-center">
        <Link href="/check" className="text-sm font-medium text-brand-700 hover:underline">
          ← Check a different carrier or trip
        </Link>
      </div>
    </div>
  );
}
