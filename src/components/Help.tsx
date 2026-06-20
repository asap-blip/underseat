import type { ReactNode } from "react";
import { PetMeasureVisual } from "./PetMeasureVisual";

// Lightweight, mobile-friendly in-flow help. Uses native <details> so it needs
// no JS, collapses by default, and never clutters the page. Keep content short
// and practical — this is in-flow guidance, not blog posts.
export function HelpPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group mt-3 rounded-2xl border border-slate-200 bg-slate-50/70">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-100">
        <span className="text-slate-400 transition-transform group-open:rotate-90">›</span>
        {title}
      </summary>
      <div className="space-y-2 px-4 pb-3 pt-1 text-sm text-slate-600">{children}</div>
    </details>
  );
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <span className="font-medium text-slate-800">{label}:</span> {children}
    </p>
  );
}

export function PetMeasureHelp() {
  return (
    <HelpPanel title="How to measure your pet">
      <PetMeasureVisual />
      <Term label="Length">measure from the nose to the base of the tail (don&apos;t include the tail).</Term>
      <Term label="Standing height">floor to the top of the shoulders or head while your pet stands normally.</Term>
      <Term label="Width">across the widest point (shoulders or hips) — handy when comparing carriers.</Term>
      <Term label="Weight">weigh yourself holding your pet, then subtract your own weight; or use a pet scale.</Term>
      <p className="text-slate-500">
        Whatever carrier you choose, your pet must still be able to <strong>stand up, turn around, and
        lie down</strong> comfortably inside it.
      </p>
    </HelpPanel>
  );
}

export function CarrierMeasureHelp() {
  return (
    <HelpPanel title="How to measure your carrier">
      <Term label="Exterior dimensions">measure length × width × height at the largest points, including feet, trim and pockets — that&apos;s what has to fit under the seat.</Term>
      <Term label="Usable interior">the inside is smaller than the outside; leave room so your pet can stand and turn, not just squeeze in.</Term>
      <Term label="Soft-sided caveat">soft carriers flex and can compress a little to fit tighter under-seat spaces, and many airlines prefer (or require) them. Hard-sided carriers don&apos;t give.</Term>
      <p className="text-slate-500">If the carrier lists official dimensions, use those — and round up if unsure.</p>
    </HelpPanel>
  );
}

export function FlightInfoHelp() {
  return (
    <HelpPanel title="How to find your airline, operating carrier & cabin">
      <Term label="Airline (booking)">the airline you bought the ticket from — it&apos;s on your confirmation email.</Term>
      <Term label="Operating carrier">who actually flies the plane. On a codeshare your itinerary says &quot;operated by …&quot;; that carrier&apos;s pet policy is the one that applies, so set it here if it differs.</Term>
      <Term label="Cabin">economy, premium economy, business or first — shown on your ticket or fare details.</Term>
      <Term label="Flight number">on your confirmation (e.g. &quot;AC 856&quot;); it helps when under-seat space varies by aircraft.</Term>
    </HelpPanel>
  );
}

export function VerdictHelp() {
  return (
    <HelpPanel title="What PASS, BORDERLINE and NO mean">
      <Term label="PASS">your carrier fits the published rules we checked for that leg.</Term>
      <Term label="BORDERLINE">it&apos;s close to a limit, or some data is incomplete — worth double-checking before you fly.</Term>
      <Term label="NO">at least one rule we checked isn&apos;t met.</Term>
      <p className="text-slate-500">
        flypewpet is a <strong>compatibility checker, not a guarantee</strong>. The airline always makes
        the final acceptance decision at the gate — confirm current policy before you travel.
      </p>
    </HelpPanel>
  );
}

export function RecommendationHelp() {
  return (
    <HelpPanel title="How we choose recommended carriers">
      <p>
        We match your pet&apos;s size and weight against the usable interior space and weight rating of
        each carrier in our <strong>carrier list</strong> (not every carrier on the market).
      </p>
      <p>
        Results are a <strong>likely fit, not a guarantee</strong> — we can&apos;t know your pet&apos;s
        exact shape or behaviour, and this step doesn&apos;t check airline rules yet (do that next).
      </p>
      <p>Carriers are ranked by fit and airline rules, <strong>never by commission</strong>. Shop links are affiliate links — we may earn a commission from qualifying purchases.</p>
    </HelpPanel>
  );
}
