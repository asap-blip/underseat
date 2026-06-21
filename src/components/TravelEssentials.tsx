"use client";

const essentials = [
  {
    id: "pee-pads",
    icon: "🟤",
    name: "Disposable pee pads",
    desc: "Essential for layovers and delays.",
    query: "pet pee pads disposable travel",
  },
  {
    id: "water-bottle",
    icon: "💧",
    name: "Portable water bottle",
    desc: "Built-in bowl for hydration on the go.",
    query: "portable pet water bottle travel bowl",
  },
  {
    id: "seatbelt-strap",
    icon: "🔗",
    name: "Car seatbelt strap",
    desc: "Secures the carrier in taxi or rental car.",
    query: "pet carrier seatbelt strap safety",
  },
];

function amazonSearchUrl(query: string): string {
  const base = `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`;
  const tag = process.env.NEXT_PUBLIC_AFFILIATE_TAG || null;
  if (!tag) return base;
  try {
    const u = new URL(base);
    u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return base;
  }
}

export function TravelEssentials() {
  return (
    <section className="soft-panel p-5">
      <h2 className="text-lg font-semibold text-slate-900">🛍 Travel Essentials</h2>
      <p className="mt-1 text-xs text-slate-500">
        Everything else you need for a smooth trip with your pet.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {essentials.map((item) => (
          <a
            key={item.id}
            href={amazonSearchUrl(item.query)}
            rel="nofollow sponsored noopener"
            target="_blank"
            className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm hover:border-brand-300 transition-colors"
          >
            <div className="text-lg">{item.icon}</div>
            <div className="mt-1 font-medium text-slate-800">{item.name}</div>
            <div className="mt-0.5 text-xs text-slate-500">{item.desc}</div>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">
        Affiliate links. We may earn a commission from qualifying purchases.
      </p>
    </section>
  );
}