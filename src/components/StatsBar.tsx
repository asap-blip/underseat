export function StatsBar({
  airlineCount,
  carrierCount,
  reportCount,
}: {
  airlineCount: number;
  carrierCount: number;
  reportCount: number;
}) {
  const stats = [
    { icon: "✈️", label: "Airlines", value: `${airlineCount} airlines` },
    { icon: "🧳", label: "Carriers", value: `${carrierCount} carriers` },
    { icon: "📝", label: "Reports", value: `${reportCount} report${reportCount === 1 ? "" : "s"}` },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-brand-100/60 bg-brand-50/50 px-5 py-3 text-xs text-slate-500">
      {stats.map((stat) => (
        <span key={stat.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">{stat.icon}</span>
          <span>
            <strong className="font-semibold text-slate-700">{stat.value}</strong>
          </span>
        </span>
      ))}
    </div>
  );
}