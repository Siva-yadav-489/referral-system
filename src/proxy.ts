import { NextRequest, NextResponse } from "next/server";

/**
 * Public routes — accessible without authentication.
 * Everything else requires a valid session.
 */
const PUBLIC_PATHS = ["/", "/login", "/signup"];

/**
 * Prefixes that are always allowed through (Next.js internals + Better-Auth API).
 */
const BYPASS_PREFIXES = [
  "/api/auth",    // Better-Auth session/sign-in endpoints
  "/_next",       // Next.js static files & HMR
  "/favicon.ico",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow bypass prefixes (Next.js internals + auth API)
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Allow public paths (exact match)
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Check for a Better-Auth session cookie.
  //    Better-Auth stores the session in "better-auth.session_token" by default.
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    // Redirect to login, preserving the intended destination via callbackUrl
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all paths except Next.js static assets and image optimisation routes.
   * The BYPASS_PREFIXES check inside the proxy handles the rest.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
