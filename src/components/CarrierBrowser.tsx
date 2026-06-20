"use client";

import { useMemo, useState } from "react";
import type { Carrier } from "@/lib/data/types";
import { CarrierCard } from "./CarrierCard";
import { VerificationLegend } from "./VerificationLegend";

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
          className="soft-input"
          placeholder="Search by brand, model, or SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="soft-input"
            placeholder="Enter a product code, such as FPP-SLP-AIR"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <button
            type="button"
            onClick={lookup}
            className="secondary-cta shrink-0 px-3 py-2 text-sm"
          >
            <span aria-hidden="true">⌕</span>
            Load
          </button>
        </div>
      </div>
      {codeMsg && <p className="text-sm text-rose-600">{codeMsg}</p>}

      <VerificationLegend />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((carrier) => (
          <CarrierCard key={carrier.id} carrier={carrier} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">No carriers match “{q}”.</p>
      )}
    </div>
  );
}
