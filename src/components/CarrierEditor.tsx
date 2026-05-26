"use client";

import { useState } from "react";
import type { Carrier, VerificationStatus } from "@/lib/data/types";
import { FreshnessBadge } from "./SourceCitation";
import { CARRIER_STATUS } from "@/lib/carrierStatus";

const input =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const label = "block text-[11px] font-medium text-slate-500 mb-1";

const VERIFICATIONS = Object.keys(CARRIER_STATUS) as VerificationStatus[];

type Editable = {
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  maxPetWeightKg: string;
  softSided: boolean;
  verification: VerificationStatus;
  verifiedAt: string;
  affiliateUrl: string;
};

function toEditable(c: Carrier): Editable {
  return {
    lengthCm: c.lengthCm.toString(),
    widthCm: c.widthCm.toString(),
    heightCm: c.heightCm.toString(),
    weightKg: c.weightKg.toString(),
    maxPetWeightKg: c.maxPetWeightKg?.toString() ?? "",
    softSided: c.softSided,
    verification: c.verification,
    verifiedAt: c.verifiedAt ?? "",
    affiliateUrl: c.affiliateUrl ?? "",
  };
}

function num(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildPatch(e: Editable) {
  return {
    lengthCm: num(e.lengthCm),
    widthCm: num(e.widthCm),
    heightCm: num(e.heightCm),
    weightKg: num(e.weightKg),
    maxPetWeightKg: e.maxPetWeightKg.trim() === "" ? null : num(e.maxPetWeightKg),
    softSided: e.softSided,
    verification: e.verification,
    verifiedAt: e.verifiedAt.trim() === "" ? null : e.verifiedAt.trim(),
    affiliateUrl: e.affiliateUrl.trim() === "" ? null : e.affiliateUrl.trim(),
  };
}

function CarrierRow({ carrier, token }: { carrier: Carrier; token: string }) {
  const [form, setForm] = useState<Editable>(() => toEditable(carrier));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof Editable>(key: K, value: Editable[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/carriers/${carrier.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify(buildPatch(form)),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Save failed");
        return;
      }
      setStatus("saved");
      setMessage("Saved");
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium text-slate-800">
          {carrier.brand} {carrier.model}
          <span className="ml-2 font-mono text-[11px] text-slate-400">{carrier.sku}</span>
        </div>
        <FreshnessBadge lastVerifiedAt={form.verifiedAt || null} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={label}>Length (cm)</label>
          <input className={input} value={form.lengthCm} onChange={(e) => set("lengthCm", e.target.value)} />
        </div>
        <div>
          <label className={label}>Width (cm)</label>
          <input className={input} value={form.widthCm} onChange={(e) => set("widthCm", e.target.value)} />
        </div>
        <div>
          <label className={label}>Height (cm)</label>
          <input className={input} value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
        </div>
        <div>
          <label className={label}>Empty weight (kg)</label>
          <input className={input} value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
        </div>
        <div>
          <label className={label}>Max pet weight (kg)</label>
          <input className={input} value={form.maxPetWeightKg} onChange={(e) => set("maxPetWeightKg", e.target.value)} />
        </div>
        <div>
          <label className={label}>Verification</label>
          <select className={input} value={form.verification} onChange={(e) => set("verification", e.target.value as VerificationStatus)}>
            {VERIFICATIONS.map((v) => (
              <option key={v} value={v}>{CARRIER_STATUS[v].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Verified (YYYY-MM-DD)</label>
          <div className="flex gap-1">
            <input className={input} value={form.verifiedAt} onChange={(e) => set("verifiedAt", e.target.value)} placeholder="2026-05-25" />
            <button
              type="button"
              onClick={() => set("verifiedAt", new Date().toISOString().slice(0, 10))}
              className="shrink-0 rounded-lg border border-slate-300 px-2 text-xs hover:bg-slate-50"
              title="Set to today"
            >
              Today
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={form.softSided} onChange={(e) => set("softSided", e.target.checked)} />
          Soft-sided
        </label>
      </div>

      <div className="mt-3">
        <label className={label}>Affiliate URL</label>
        <input className={input} value={form.affiliateUrl} onChange={(e) => set("affiliateUrl", e.target.value)} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {message && (
          <span className={`text-xs ${status === "error" ? "text-rose-600" : "text-emerald-600"}`}>{message}</span>
        )}
      </div>
    </div>
  );
}

export function CarrierEditor({ carriers }: { carriers: Carrier[] }) {
  const [token, setToken] = useState("");
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? carriers.filter((c) => `${c.brand} ${c.model} ${c.sku}`.toLowerCase().includes(q.toLowerCase()))
    : carriers;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <label className={label}>Admin token (only required if ADMIN_TOKEN is set on the server)</label>
        <input
          className={`${input} max-w-sm`}
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="leave blank in local dev"
        />
        <p className="mt-1 text-xs text-slate-400">
          Edits persist to Supabase when configured; otherwise they apply to the in-memory seed for
          this server session only.
        </p>
      </div>
      <input
        className={`${input} max-w-md`}
        placeholder="Filter carriers by brand, model, or SKU…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="space-y-3">
        {filtered.map((c) => (
          <CarrierRow key={c.id} carrier={c} token={token} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No carriers match “{q}”.</p>}
      </div>
    </div>
  );
}
