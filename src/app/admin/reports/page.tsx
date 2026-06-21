"use client";

import { useEffect, useState } from "react";

interface CarrierReport {
  id: string;
  carrier_id: string;
  airline_id: string | null;
  fit_status: string;
  notes: string | null;
  submitted_at: string;
  status: string;
  submitted_by_email: string | null;
  carriers?: { brand: string; model: string } | null;
  airlines?: { name: string } | null;
}

const fitLabels: Record<string, string> = {
  fits: "Fits",
  tight: "Tight fit",
  does_not_fit: "Does not fit",
};

const fitColors: Record<string, string> = {
  fits: "bg-emerald-50 text-emerald-700",
  tight: "bg-amber-50 text-amber-700",
  does_not_fit: "bg-rose-50 text-rose-700",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<CarrierReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    // Check for token in URL params or prompt user
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (t) {
      setToken(t);
      authenticateAndFetch(t);
    } else {
      setLoading(false);
    }
  }, []);

  async function authenticateAndFetch(t: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports", {
        headers: { "x-admin-token": t },
      });
      if (!res.ok) {
        setError("Invalid admin token");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReports(data.reports || []);
      setAuthenticated(true);
    } catch {
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    authenticateAndFetch(token);
  }

  async function handleAction(reportId: string, action: "approve" | "reject") {
    setActioning(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      setError("Failed to update report");
    } finally {
      setActioning(null);
    }
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-600">Enter the admin token to manage carrier reports.</p>
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
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · Carrier Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review and action pending carrier reports from the &quot;Help us verify&quot; form.
          </p>
        </div>
        <a href="/admin/reports?token=" className="text-xs text-slate-400 hover:text-slate-600">
          Logout
        </a>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading reports…
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No pending reports. All caught up!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Airline</th>
                <th className="px-4 py-3">Fit</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.carriers?.brand ?? r.carrier_id} {r.carriers?.model ?? ""}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.airlines?.name ?? r.airline_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${fitColors[r.fit_status] ?? ""}`}>
                      {fitLabels[r.fit_status] ?? r.fit_status}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">{r.notes ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {new Date(r.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actioning === r.id}
                        onClick={() => handleAction(r.id, "approve")}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                      >
                        {actioning === r.id ? "…" : "✅ Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={actioning === r.id}
                        onClick={() => handleAction(r.id, "reject")}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                      >
                        {actioning === r.id ? "…" : "❌ Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Approving a report sets the carrier&apos;s verification to &quot;team_verified&quot; and updates the verified date.
      </p>
    </div>
  );
}