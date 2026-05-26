"use client";

import { useState } from "react";
import type { CarrierStatus as Status } from "@/lib/data/types";
import { STATUS_TONE_CLASS, carrierStatusConfig } from "@/lib/carrierStatus";

// One primary status badge + an info popover explaining its meaning, with a
// secondary evidence line beneath. Replaces the old stacked verification badges.
export function CarrierStatus({ status, evidence }: { status: Status; evidence?: string }) {
  const [open, setOpen] = useState(false);
  const config = carrierStatusConfig(status);

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <div className="relative flex items-center gap-1">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_TONE_CLASS[config.tone]}`}
        >
          {config.label}
        </span>
        <button
          type="button"
          aria-label={`What does "${config.label}" mean?`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setOpen(false)}
          className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
        >
          i
          {open && (
            <span
              role="tooltip"
              className="absolute right-0 top-6 z-10 w-56 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-slate-600 shadow-lg"
            >
              <span className="mb-1 block font-semibold text-slate-800">{config.label}</span>
              {config.description}
            </span>
          )}
        </button>
      </div>
      {evidence && <span className="text-[10px] text-slate-400">{evidence}</span>}
    </div>
  );
}
