"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import topCarriers from "@/lib/data/top-carriers";

// ─── Types ────────────────────────────────────────────────────────────────

interface CarrierRow {
  brand: string;
  model: string;
  sku: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  maxPetWeightKg: string;
  softSided: string;
  affiliateUrl: string;
  affiliateNetwork: string;
  imageUrl: string;
}

type Tab = "bulk" | "single";

interface ImportResult {
  inserted: string[];
  skipped: number;
  errors?: string[];
  note?: string;
}

// ─── Columns shown in CSV preview ─────────────────────────────────────────

const CSV_COLUMNS: { key: keyof CarrierRow; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "sku", label: "SKU" },
  { key: "lengthCm", label: "Length (cm)" },
  { key: "widthCm", label: "Width (cm)" },
  { key: "heightCm", label: "Height (cm)" },
  { key: "weightKg", label: "Weight (kg)" },
  { key: "maxPetWeightKg", label: "Max pet (kg)" },
  { key: "softSided", label: "Soft-sided" },
  { key: "affiliateUrl", label: "Affiliate URL" },
  { key: "affiliateNetwork", label: "Network" },
  { key: "imageUrl", label: "Image URL" },
];

// ─── Tab button ──────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-100 text-brand-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Result banner ────────────────────────────────────────────────────────

function ResultBanner({
  result,
  error,
}: {
  result: ImportResult | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  if (!result) return null;

  const hasErrors = (result.errors?.length ?? 0) > 0;
  const allSkipped = result.inserted.length === 0 && result.skipped > 0;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        hasErrors
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : allSkipped
            ? "border-slate-200 bg-slate-50 text-slate-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <p className="font-medium">
        {result.inserted.length > 0
          ? `✅ ${result.inserted.length} carrier${result.inserted.length === 1 ? "" : "s"} imported`
          : "No new carriers imported"}
      </p>
      {result.skipped > 0 && (
        <p className="mt-0.5 text-xs opacity-70">
          ⏭️ {result.skipped} already existed (skipped)
        </p>
      )}
      {result.errors && result.errors.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-xs text-rose-600">
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {result.note && <p className="mt-1 text-xs opacity-70">{result.note}</p>}
    </div>
  );
}

// ─── Bulk Import Tab ─────────────────────────────────────────────────────

function BulkImportTab({ token }: { token: string }) {
  const [parsedRows, setParsedRows] = useState<CarrierRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(results) {
        if (results.errors.length > 0) {
          setError(`CSV parse error: ${results.errors[0].message}`);
          return;
        }
        const rows: CarrierRow[] = results.data.map((r) => ({
          brand: (r.brand ?? "").trim(),
          model: (r.model ?? r.name ?? "").trim(),
          sku: (r.sku ?? "").trim(),
          lengthCm: (r.length_cm ?? r.lengthCm ?? "").trim(),
          widthCm: (r.width_cm ?? r.widthCm ?? "").trim(),
          heightCm: (r.height_cm ?? r.heightCm ?? "").trim(),
          weightKg: (r.weight_kg ?? r.weightKg ?? "").trim(),
          maxPetWeightKg: (r.max_pet_weight_kg ?? r.maxPetWeightKg ?? "").trim(),
          softSided: (r.soft_sided ?? r.softSided ?? "").trim(),
          affiliateUrl: (r.affiliate_url ?? r.affiliateUrl ?? "").trim(),
          affiliateNetwork: (r.affiliate_network ?? r.affiliateNetwork ?? "").trim(),
          imageUrl: (r.image_url ?? r.imageUrl ?? "").trim(),
        }));
        setParsedRows(rows);
      },
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/import-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ carriers: parsedRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        if (data.details) setError(`${data.error}: ${data.details.join("; ")}`);
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }, [parsedRows, token]);

  const preview = parsedRows.slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          CSV file
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="mt-1 text-xs text-slate-400">
          Expected columns: {CSV_COLUMNS.map((c) => c.label).join(", ")}
        </p>
      </div>

      {fileName && parsedRows.length > 0 && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Preview ({parsedRows.length} rows parsed)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-400">
                    {CSV_COLUMNS.map((col) => (
                      <th key={col.key} className="whitespace-nowrap px-2 py-1.5">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {CSV_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className="max-w-[120px] truncate whitespace-nowrap px-2 py-1.5 text-slate-600"
                        >
                          {row[col.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 5 && (
              <p className="mt-2 text-xs text-slate-400">
                … and {parsedRows.length - 5} more rows
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="primary-cta px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting
              ? "Importing…"
              : `Import ${parsedRows.length} carrier${parsedRows.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}

      <ResultBanner result={result} error={error} />
    </div>
  );
}

// ─── Single Carrier Tab ──────────────────────────────────────────────────

const NETWORKS = [
  { value: "", label: "— Select —" },
  { value: "amazon", label: "Amazon" },
  { value: "chewy", label: "Chewy" },
  { value: "other", label: "Other" },
];

function SingleCarrierTab({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const carrier: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (value instanceof File) continue;
      carrier[key] = value;
    }

    try {
      const res = await fetch("/api/admin/import-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(carrier),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        if (data.details) setError(`${data.error}: ${data.details.join("; ")}`);
      } else {
        setResult(data);
        if (data.inserted?.length > 0) {
          formRef.current?.reset();
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Brand *</label>
          <input name="brand" required className={inputCls} placeholder="e.g. Sherpa" />
        </div>
        <div>
          <label className={labelCls}>Model *</label>
          <input name="model" required className={inputCls} placeholder="e.g. Deluxe" />
        </div>
        <div>
          <label className={labelCls}>SKU</label>
          <input name="sku" className={inputCls} placeholder="Auto-generated if blank" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              name="softSided"
              type="checkbox"
              value="true"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
            />
            Soft-sided
          </label>
        </div>
        <div>
          <label className={labelCls}>Length (cm) *</label>
          <input
            name="lengthCm"
            type="number"
            step="0.1"
            min="0.1"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Width (cm) *</label>
          <input
            name="widthCm"
            type="number"
            step="0.1"
            min="0.1"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Height (cm) *</label>
          <input
            name="heightCm"
            type="number"
            step="0.1"
            min="0.1"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Weight (kg) *</label>
          <input
            name="weightKg"
            type="number"
            step="0.01"
            min="0.01"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Max pet weight (kg)</label>
          <input name="maxPetWeightKg" type="number" step="0.1" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Affiliate network</label>
          <select name="affiliateNetwork" className={inputCls}>
            {NETWORKS.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Affiliate URL</label>
          <input
            name="affiliateUrl"
            type="url"
            className={inputCls}
            placeholder="https://amazon.com/…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Image URL</label>
          <input
            name="imageUrl"
            type="url"
            className={inputCls}
            placeholder="https://images.example.com/…"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="primary-cta px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add Carrier"}
      </button>

      <ResultBanner result={result} error={error} />
    </form>
  );
}

// ─── Seed Import Row ──────────────────────────────────────────────────────

function SeedImportRow({ token }: { token: string }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeedImport() {
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/import-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ carriers: topCarriers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        if (data.details) setError(`${data.error}: ${data.details.join("; ")}`);
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        📦 Top-Selling Seed Import
      </h2>
      <p className="mb-3 text-sm text-slate-500">
        One-click import of {topCarriers.length} curated carriers from top-selling
        Amazon brands (Sherpa, Mr. Peanut&apos;s, Sleepypod, Petmate, Frisco, and more).
      </p>
      <button
        type="button"
        disabled={importing}
        onClick={handleSeedImport}
        className="primary-cta px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {importing
          ? "Importing…"
          : `Load ${topCarriers.length} Carriers from Top-Selling Seed`}
      </button>

      <ResultBanner result={result} error={error} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AdminImportCarriersPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("bulk");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (t) {
      setToken(t);
      verifyAndSet(t);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyAndSet(t: string) {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/import-carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": t,
        },
        body: JSON.stringify({ carriers: [] }),
      });
      if (res.status === 401) {
        setAuthError("Invalid admin token");
        setLoading(false);
        return;
      }
      setAuthenticated(true);
    } catch {
      setAuthError("Failed to verify admin token");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    verifyAndSet(token);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Verifying admin token…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-600">
          Enter the admin token to import carriers.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            className="soft-input"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button type="submit" className="primary-cta w-full px-4 py-2.5 text-sm">
            Login
          </button>
        </form>
        {authError && <p className="text-sm text-rose-600">{authError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin · Import Carriers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add carriers individually, in bulk via CSV, or from the curated seed
            list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin" className="text-xs text-slate-400 hover:text-slate-600">
            Data
          </a>
          <span className="text-slate-300">·</span>
          <a href="/admin/reports" className="text-xs text-slate-400 hover:text-slate-600">
            Reports
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="/admin/import-carriers?token="
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Logout
          </a>
        </div>
      </div>

      <SeedImportRow token={token} />

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
          📋 Bulk Import (CSV)
        </TabButton>
        <TabButton active={tab === "single"} onClick={() => setTab("single")}>
          ➕ Add Single Carrier
        </TabButton>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {tab === "bulk" ? (
          <BulkImportTab token={token} />
        ) : (
          <SingleCarrierTab token={token} />
        )}
      </div>
    </div>
  );
}