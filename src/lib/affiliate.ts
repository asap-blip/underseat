import type { Carrier } from "@/lib/data/types";

// Resolve the outbound destination for a carrier on a given network, appending
// the configured affiliate tag. Networks/links are seedable so they can be
// swapped per merchant or affiliate program later without code changes.
export function resolveAffiliateTarget(
  carrier: Carrier,
  network = "amazon",
): { network: string; url: string } | null {
  const base =
    carrier.affiliateTargets?.[network] ?? carrier.affiliateUrl ?? null;
  if (!base) return null;

  const tag = process.env.NEXT_PUBLIC_AFFILIATE_TAG;
  if (!tag) return { network, url: base };

  try {
    const u = new URL(base);
    // Amazon uses `tag`; keep it generic for others.
    if (u.hostname.includes("amazon")) u.searchParams.set("tag", tag);
    else u.searchParams.set("aff", tag);
    return { network, url: u.toString() };
  } catch {
    return { network, url: base };
  }
}

// Internal tracked click URL that records the click server-side before
// redirecting to the affiliate destination.
export function trackedClickUrl(
  carrierId: string,
  network = "amazon",
  checkToken?: string,
): string {
  const params = new URLSearchParams({ carrier: carrierId, network });
  if (checkToken) params.set("check", checkToken);
  return `/api/click?${params.toString()}`;
}
