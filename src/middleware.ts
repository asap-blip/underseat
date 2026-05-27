import { NextResponse, type NextRequest } from "next/server";
import { adminAuthMode, isAdminTokenAuthorized } from "@/lib/auth/admin";

// Server-side gate for the /admin/* pages (the API routes enforce their own
// x-admin-token check). Pages are protected with HTTP Basic auth so they can't
// render without authorization: the browser prompts for credentials and the
// password is matched against ADMIN_TOKEN.
export const config = { matcher: ["/admin/:path*"] };

function promptForCredentials(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="flypewpet admin", charset="UTF-8"' },
  });
}

export async function middleware(req: NextRequest) {
  const mode = adminAuthMode();
  if (mode === "open") return NextResponse.next();
  if (mode === "locked") {
    // Production with no ADMIN_TOKEN configured: fail closed.
    return new NextResponse(
      "Admin is unavailable: ADMIN_TOKEN is not configured on the server.",
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return promptForCredentials();

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return promptForCredentials();
  }
  const password = decoded.slice(decoded.indexOf(":") + 1);

  if (await isAdminTokenAuthorized(password)) return NextResponse.next();
  return promptForCredentials();
}
