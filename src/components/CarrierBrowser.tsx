"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { trackedClickUrl } from "@/lib/affiliate";
import { FreshnessBadge } from "./SourceCitation";

const verificationBadge: Record<Carrier["verification"], { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700" },
  community: { label: "Community", cls: "bg-slate-100 text-slate-600" },
  unverified: { label: "Unverified", cls: "bg-amber-50 text-amber-700" },
};

export function CarrierBrowser({ carriers }: { carriers: Carrier[] }) {
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return carriers;
    const needle = q.toLowerCase();
    return carriers.filter((c) =>
      `${c.brand} ${c.model} ${c.sku}`.toLowerCase().includes(needle),
    );
  }, [q, carriers]);

  async function lookup() {
    setCodeMsg(null);
    if (!code.trim()) return;
    const res = await fetch(`/api/resolve?code=${encodeURIComponent(code.trim())}`);
    if (!res.ok) {
      setCodeMsg("No carrier matched that code.");
      return;
    }
    const data = await res.json();
    window.location.href = `/check?carrier=${data.carrier.id}`;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Search by brand, model, or SKU…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Scan or enter a product code (e.g. FPP-SLP-AIR)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <button
            type="button"
            onClick={lookup}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Load
          </button>
        </div>
      </div>
      {codeMsg && <p className="text-sm text-rose-600">{codeMsg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const v = verificationBadge[c.verification];
          return (
            <div key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-500">{c.brand}</div>
                  <div className="font-semibold text-slate-900">{c.model}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.cls}`}>{v.label}</span>
                  <FreshnessBadge lastVerifiedAt={c.verifiedAt} />
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-500">
                <div>{c.lengthCm} × {c.widthCm} × {c.heightCm} cm · {c.softSided ? "soft-sided" : "hard-sided"}</div>
                <div>Empty weight {c.weightKg} kg · SKU {c.sku}</div>
              </dl>
              <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                <Link
                  href={`/check?carrier=${c.id}`}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Check my trip
                </Link>
                <Link
                  href={trackedClickUrl(c.id)}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  title="Affiliate link — we may earn a commission"
                >
                  Shop <span className="text-[10px] text-slate-400">(affiliate)</span> →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">No carriers match “{q}”.</p>
      )}
    </div>
  );
}
