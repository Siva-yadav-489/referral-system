import { NextRequest, NextResponse } from "next/server";

/**
 * Prefixes that are always allowed through (Next.js internals + Better-Auth API).
 */
const BYPASS_PREFIXES = [
  "/api/auth", // Better-Auth session/sign-in endpoints
  "/_next", // Next.js static files & HMR
  "/favicon.ico",
];

/**
 * Routes intended only for unauthenticated guests (auth & referral flows).
 */
const GUEST_ONLY_ROUTES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow bypass prefixes (Next.js internals + auth API)
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Check for Better-Auth session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isGuestOnlyRoute =
    GUEST_ONLY_ROUTES.includes(pathname) || pathname.startsWith("/referral");

  // 3. Restrict logged-in users from accessing auth and referral routes
  if (sessionToken && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL("/dashboard/occupancy", request.url));
  }

  // 4. Allow public paths (home page, or guest-only routes for non-logged-in users)
  const isPublicPath = pathname === "/" || isGuestOnlyRoute;

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 5. If not logged in and accessing protected routes, redirect to login
  if (!sessionToken) {
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
