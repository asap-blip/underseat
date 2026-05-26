import { SOURCE_TYPE_LABELS, type SourceType } from "@/lib/data/types";
import { freshness, freshnessStyles } from "@/lib/freshness";

export function FreshnessBadge({ lastVerifiedAt }: { lastVerifiedAt?: string | null }) {
  const f = freshness(lastVerifiedAt);
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessStyles[f.band]}`}>
      {f.label}
    </span>
  );
}

export function SourceTypeChip({ type }: { type?: SourceType | null }) {
  if (!type) return null;
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
      {SOURCE_TYPE_LABELS[type]}
    </span>
  );
}

// Inline citation of the exact rule source behind a verdict. `compact` is used
// on the results page; the full form is used in the rules directory.
export function SourceCitation({
  sourceUrl,
  sourceLabel,
  sourceType,
  lastVerifiedAt,
  compact = false,
}: {
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  sourceType?: SourceType | null;
  lastVerifiedAt?: string | null;
  compact?: boolean;
}) {
  if (!sourceUrl && !sourceLabel) {
    return (
      <span className="text-xs text-slate-400">
        No official source on file <FreshnessBadge lastVerifiedAt={lastVerifiedAt} />
      </span>
    );
  }
  const host = (() => {
    try {
      return sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="text-slate-500">Source:</span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline">
          {sourceLabel ?? host}
        </a>
      ) : (
        <span className="font-medium text-slate-700">{sourceLabel}</span>
      )}
      {host && sourceLabel && <span className="text-slate-400">({host})</span>}
      <SourceTypeChip type={sourceType} />
      <FreshnessBadge lastVerifiedAt={lastVerifiedAt} />
      <span className="text-slate-400">
        Last verified: {lastVerifiedAt ?? "not on file"}
      </span>
    </div>
  );
}
