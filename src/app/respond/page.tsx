import Link from "next/link";
import { TravelerResponseForm } from "@/components/TravelerResponseForm";
import { getServiceSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Outcome = "worked" | "did_not_work" | "mixed";

function normalizeOutcome(o?: string): Outcome | undefined {
  return o === "worked" || o === "did_not_work" || o === "mixed" ? o : undefined;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{body}</p>
      <Link
        href="/check"
        className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
      >
        Check another trip
      </Link>
    </div>
  );
}

export default async function RespondPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; o?: string }>;
}) {
  const { f, o } = await searchParams;

  if (!f) {
    return <Notice title="This link is incomplete" body="We couldn't tell which trip this is for." />;
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return (
      <Notice
        title="This link can't be opened right now"
        body="Follow-up responses need the live database, which isn't configured here."
      />
    );
  }

  const { data } = await sb
    .from("trip_followups")
    .select("id, route_text, followup_status")
    .eq("id", f)
    .maybeSingle();

  if (!data) {
    return <Notice title="We couldn't find that trip" body="This follow-up link may be invalid or expired." />;
  }
  if (data.followup_status === "completed") {
    return (
      <Notice
        title="You've already answered — thank you!"
        body="We've recorded how this trip went. There's nothing more to do."
      />
    );
  }
  if (data.followup_status === "cancelled") {
    return (
      <Notice
        title="This follow-up was cancelled"
        body="No response is needed. You can still check another trip anytime."
      />
    );
  }

  return (
    <TravelerResponseForm
      followupId={data.id as string}
      routeText={data.route_text as string | null}
      initialOutcome={normalizeOutcome(o)}
    />
  );
}
