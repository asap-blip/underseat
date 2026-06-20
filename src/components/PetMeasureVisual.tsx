"use client";

import { useState } from "react";

type Species = "dog" | "cat";

// Schematic side-profile silhouettes composed from simple shapes. Kept generic
// (one universal dog, one universal cat) on purpose — body-type variants can be
// added later by extending this switch, not by per-breed art.
function Silhouette({ species }: { species: Species }) {
  const fill = "fill-slate-300";
  const stroke = "stroke-slate-400";
  if (species === "cat") {
    return (
      <g className={`${fill} ${stroke}`} strokeWidth="1.5">
        {/* tail (upright) */}
        <path d="M86,118 C68,114 64,82 78,58 C88,82 98,108 102,118 Z" />
        {/* body */}
        <ellipse cx="152" cy="118" rx="66" ry="28" />
        {/* legs */}
        <rect x="104" y="140" width="11" height="30" rx="4" />
        <rect x="132" y="142" width="11" height="28" rx="4" />
        <rect x="196" y="140" width="11" height="30" rx="4" />
        <rect x="216" y="142" width="11" height="28" rx="4" />
        {/* head */}
        <circle cx="232" cy="98" r="22" />
        {/* ears (pointy) */}
        <polygon points="214,84 220,60 232,82" />
        <polygon points="234,82 246,60 250,84" />
        {/* muzzle hint */}
        <circle cx="252" cy="102" r="5" />
      </g>
    );
  }
  return (
    <g className={`${fill} ${stroke}`} strokeWidth="1.5">
      {/* tail (curled up) */}
      <path d="M80,98 C56,94 52,70 66,58 C72,76 86,90 94,100 Z" />
      {/* body */}
      <ellipse cx="150" cy="112" rx="74" ry="32" />
      {/* legs */}
      <rect x="98" y="138" width="12" height="32" rx="4" />
      <rect x="122" y="140" width="12" height="30" rx="4" />
      <rect x="214" y="138" width="12" height="32" rx="4" />
      <rect x="236" y="140" width="12" height="30" rx="4" />
      {/* head */}
      <circle cx="236" cy="94" r="27" />
      {/* floppy ear */}
      <path d="M226,70 C214,66 212,90 224,96 C232,88 234,76 226,70 Z" />
      {/* muzzle + nose */}
      <rect x="256" y="92" width="24" height="16" rx="7" />
    </g>
  );
}

export function PetMeasureVisual() {
  const [species, setSpecies] = useState<Species>("dog");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Visual guide</span>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
          {(["dog", "cat"] as Species[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecies(s)}
              aria-pressed={species === s}
              className={`rounded-md px-3 py-1 capitalize ${
                species === s ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox="0 0 320 250"
        className="h-auto w-full"
        role="img"
        aria-label={`How to measure a ${species}: length from nose to base of tail, height from floor to top of head or ears, and widest body width`}
      >
        {/* arrowhead marker */}
        <defs>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-brand-600" />
          </marker>
        </defs>

        {/* floor */}
        <line x1="28" y1="172" x2="300" y2="172" className="stroke-slate-300" strokeWidth="1.5" strokeDasharray="4 4" />

        <Silhouette species={species} />

        {/* length arrow (nose -> base of tail) */}
        <line x1="74" y1="36" x2="276" y2="36" className="stroke-brand-600" strokeWidth="1.5" markerStart="url(#ah)" markerEnd="url(#ah)" />
        <line x1="74" y1="42" x2="74" y2="92" className="stroke-slate-300" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="276" y1="42" x2="276" y2="92" className="stroke-slate-300" strokeWidth="1" strokeDasharray="3 3" />
        <text x="175" y="28" textAnchor="middle" className="fill-slate-600 text-[11px]">Length: nose to base of tail</text>

        {/* height arrow (floor -> top of head/ears) */}
        <line x1="44" y1="172" x2="44" y2="58" className="stroke-brand-600" strokeWidth="1.5" markerStart="url(#ah)" markerEnd="url(#ah)" />
        <text x="0" y="0" transform="translate(20,150) rotate(-90)" className="fill-slate-600 text-[11px]">Height: floor to head/ears</text>

        {/* width mini-diagram (head-on body cross-section) */}
        <ellipse cx="78" cy="208" rx="30" ry="15" className="fill-slate-300 stroke-slate-400" strokeWidth="1.5" />
        <line x1="48" y1="232" x2="108" y2="232" className="stroke-brand-600" strokeWidth="1.5" markerStart="url(#ah)" markerEnd="url(#ah)" />
        <text x="124" y="214" className="fill-slate-600 text-[11px]">Width: widest part</text>
        <text x="124" y="228" className="fill-slate-600 text-[11px]">the shoulders or body</text>
      </svg>

      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        <li>• Do <strong>not</strong> include the tail in the length.</li>
        <li>• Measure while your pet is <strong>standing naturally</strong>.</li>
        <li>• Ears count if they are the highest point.</li>
        <li>• Your pet must be able to <strong>stand, turn around, and lie down</strong> in the carrier.</li>
      </ul>
    </div>
  );
}
