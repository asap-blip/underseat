"use client";

import { useState } from "react";
import type { ModerationStatus, TravelerReport } from "@/lib/data/types";

const input =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

const ACTIONS: { status: ModerationStatus; label: string; cls: string }[] = [
  { status: "approved", label: "Approve", cls: "bg-emerald-600 hover:bg-emerald-700" },
  { status: "rejected", label: "Reject", cls: "bg-slate-600 hover:bg-slate-700" },
  { status: "spam", label: "Spam", cls: "bg-rose-600 hover:bg-rose-700" },
];

const outcomeLabel: Record<string, string> = {
  accepted: "Worked (accepted)",
  denied: "Did not work (denied)",
  unsure: "Mixed (unsure)",
};

function ReportRow({ report, token }: { report: TravelerReport; token: string }) {
  const [status, setStatus] = useState<ModerationStatus>(report.moderationStatus);
  const [busy, setBusy] = useState<ModerationStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function moderate(next: ModerationStatus) {
    setBusy(next);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
        body: JSON.stringify({ moderationStatus: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setMessage(data.error ?? "Failed");
        return;
      }
      setStatus(next);
      setMessage(`Set to ${next} · verification re-aggregated`);
    } catch {
      setError(true);
      setMessage("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium text-slate-800">{report.carrierId ?? "—"}</span>
          <span className="text-slate-400"> on </span>
          <span className="font-medium text-slate-800">{report.airlineId ?? "—"}</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {status}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {outcomeLabel[report.outcome] ?? report.outcome}
        {report.stage ? ` · ${report.stage}` : ""}
        {report.travelDate ? ` · ${report.travelDate}` : ""}
        {report.evidenceLevel ? ` · ${report.evidenceLevel}` : ""}
      </div>
      {report.notes && <p className="mt-2 text-sm text-slate-700">“{report.notes}”</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.status}
            type="button"
            onClick={() => moderate(a.status)}
            disabled={busy !== null || status === a.status}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${a.cls}`}
          >
            {busy === a.status ? "…" : a.label}
          </button>
        ))}
        {message && (
          <span className={`text-xs ${error ? "text-rose-600" : "text-emerald-600"}`}>{message}</span>
        )}
      </div>
    </div>
  );
}

export function ReportModerator({ reports }: { reports: TravelerReport[] }) {
  const [token, setToken] = useState("");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <label className="mb-1 block text-[11px] font-medium text-slate-500">
          Admin token (only required if ADMIN_TOKEN is set on the server)
        </label>
        <input
          className={`${input} max-w-sm`}
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="leave blank in local dev"
        />
        <p className="mt-1 text-xs text-slate-400">
          Approving a report recomputes the carrier-airline verification (counts, confidence, status).
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-slate-500">No reports awaiting review.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
