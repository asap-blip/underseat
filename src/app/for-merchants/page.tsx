import Link from "next/link";
import { CheckWidget } from "@/components/CheckWidget";
import { CopySnippetButton } from "@/components/CopySnippetButton";
import { MerchantSignupForm } from "@/components/MerchantSignupForm";
import { getRepository } from "@/lib/data/repository";
import { buildCoverageMap } from "@/lib/coverage";

export const dynamic = "force-dynamic";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "For small shops just getting started.",
    features: [
      "Up to 500 checks / month",
      "Branded embed widget",
      "Basic click analytics",
      "Community support",
    ],
    cta: "Get started free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/month",
    description: "For growing pet-travel retailers.",
    features: [
      "Up to 10,000 checks / month",
      "White-label widget",
      "Full click + conversion analytics",
      "Priority email support",
      "Affiliate link integration",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For high-volume stores and marketplaces.",
    features: [
      "Unlimited checks",
      "API access",
      "Custom branding",
      "Revenue share program",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    featured: false,
  },
];

const embedSnippet = `<script src="https://flypewpet.vercel.app/widget.js" data-carrier-id="CARRIER_ID" data-airline="unlimited"></script>`;

export default async function ForMerchantsPage() {
  const repo = getRepository();
  const [airlines, rules] = await Promise.all([repo.listAirlines(), repo.listRules()]);
  const coverage = buildCoverageMap(airlines, rules);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-4">
        <h1 className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Help your customers buy the right carrier
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
          Embed a compatibility checker on your product pages so shoppers know a carrier
          fits their flight before they buy. Reduce returns. Increase conversions.
        </p>
      </section>

      {/* Live demo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">See it in action</h2>
        <p className="mt-1 text-sm text-slate-600">
          This is the same widget your customers would see on your product page.
        </p>
        <div className="mt-4 max-w-md">
          <CheckWidget
            carrierId="sherpa-original-md"
            carrierLabel="Sherpa Original Deluxe (Medium)"
            airlines={airlines}
            coverage={coverage}
          />
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="text-center text-2xl font-semibold text-slate-900">Simple pricing</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600">
          Start free. Upgrade when you need more volume or features.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.featured
                  ? "border-brand-500 ring-2 ring-brand-100"
                  : "border-slate-200"
              } bg-white`}
            >
              {tier.featured && (
                <span className="mb-3 inline-block self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-slate-500">{tier.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  tier.featured
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <MerchantSignupForm />

      {/* Embed snippet */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Embed snippet</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste this into your product page HTML. Replace <code className="rounded bg-slate-100 px-1 text-xs">CARRIER_ID</code> with your carrier&apos;s ID.
        </p>
        <div className="mt-4 rounded-xl bg-slate-900 p-4">
          <pre className="overflow-x-auto text-sm text-slate-100">
            <code>{embedSnippet}</code>
          </pre>
        </div>
        <CopySnippetButton snippet={embedSnippet} />
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
        <dl className="mt-4 space-y-4">
          {[
            {
              q: "How does the widget work?",
              a: "The widget calls our /api/check endpoint with the carrier and the customer's flight details. It renders a PASS / BORDERLINE / NO verdict inline on your page.",
            },
            {
              q: "Do I need a developer?",
              a: "Nope. Paste the snippet into your product page template and you're done. If you use Shopify, WooCommerce, or BigCommerce, we have guides for each.",
            },
            {
              q: "Can I customize the look?",
              a: "Growth and Pro plans support custom colors and branding. The Starter plan uses the default flypewpet styling.",
            },
            {
              q: "How do affiliate links work?",
              a: "If you have affiliate accounts, we can route outbound buy-button clicks through your links. You earn the commission, we earn a small revenue share on Pro plans.",
            },
          ].map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-semibold text-slate-900">{item.q}</dt>
              <dd className="mt-1 text-sm text-slate-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Bottom CTA */}
      <section className="rounded-2xl bg-slate-900 p-8 text-center text-slate-100">
        <h2 className="text-2xl font-semibold">Ready to reduce returns and boost conversions?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">
          Join pet retailers who use flypewpet to help customers buy with confidence.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="#"
            className="rounded-lg bg-white px-6 py-2.5 font-medium text-slate-900 hover:bg-slate-100"
          >
            Start free
          </Link>
          <Link
            href="/merchant/petgearco"
            className="rounded-lg border border-slate-600 px-6 py-2.5 font-medium text-slate-300 hover:border-slate-400"
          >
            View full demo
          </Link>
        </div>
      </section>
    </div>
  );
}
