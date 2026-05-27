// Admin authorization shared by the admin API routes and the /admin middleware.
//
// Modes:
//   enforced  ADMIN_TOKEN is set        -> a matching token is required.
//   open      no token, non-production  -> allowed (local-dev convenience).
//   locked    no token, production      -> denied (fail closed).
//
// Runtime-agnostic: uses Web Crypto + globals only, so it works in both the
// Node.js (API route) and Edge (middleware) runtimes.

export type AdminAuthMode = "enforced" | "open" | "locked";

function adminToken(): string {
  return process.env.ADMIN_TOKEN?.trim() ?? "";
}

export function adminAuthMode(): AdminAuthMode {
  if (adminToken()) return "enforced";
  return process.env.NODE_ENV === "production" ? "locked" : "open";
}

// Constant-time comparison via SHA-256 prehash: hashing both inputs to a fixed
// 32-byte digest keeps the compare loop independent of input length, so neither
// the token value nor its length leaks through timing.
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i += 1) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// Authorize a presented credential (admin API header, or basic-auth password).
export async function isAdminTokenAuthorized(
  presented: string | null | undefined,
): Promise<boolean> {
  const mode = adminAuthMode();
  if (mode === "open") return true;
  if (mode === "locked") return false;
  if (!presented) return false;
  return constantTimeEqual(presented, adminToken());
}
