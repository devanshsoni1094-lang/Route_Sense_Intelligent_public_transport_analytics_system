import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  try {
    const { pathname, search } = request.nextUrl;
    const cleanPath = pathname.replace(/\/+$/, "") || "/";

    // 1. Allow static files, Next.js internal chunks, images, and public assets
    if (
      cleanPath.startsWith("/_next") ||
      cleanPath.startsWith("/api/v1/auth") ||
      cleanPath.startsWith("/images") ||
      cleanPath === "/favicon.ico" ||
      PUBLIC_FILE.test(cleanPath)
    ) {
      return NextResponse.next();
    }

    // 2. Allow public authentication pages (handles /login, /login/, /auth/*)
    if (
      cleanPath === "/login" ||
      cleanPath.startsWith("/login") ||
      cleanPath.startsWith("/auth")
    ) {
      return NextResponse.next();
    }

    // 3. Safely check for authenticated session token
    let sessionCookie: string | undefined;
    try {
      sessionCookie = request.cookies.get("routesense_session")?.value;
    } catch {
      sessionCookie = undefined;
    }

    let hasSupabaseSession = false;
    try {
      const allCookies = request.cookies?.getAll?.() || [];
      for (const cookie of allCookies) {
        if (cookie?.name && cookie.name.includes("auth-token") && cookie.value) {
          hasSupabaseSession = true;
          break;
        }
      }
    } catch {
      hasSupabaseSession = false;
    }

    const isAuthenticated = Boolean(sessionCookie || hasSupabaseSession);

    // 4. If unauthenticated, redirect or return 401
    if (!isAuthenticated) {
      // If request is an API call, return 401 Unauthorized
      if (cleanPath.startsWith("/api/")) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Authentication required to access this endpoint." },
          { status: 401 }
        );
      }

      // Safe clone-based redirect preserving public domain, protocol (https), and port on Vercel
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";

      const destination = pathname + search;
      if (destination && destination !== "/" && !destination.startsWith("/login")) {
        redirectUrl.searchParams.set("redirect", destination);
      }

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // Fail open safely to prevent 500 FUNCTION_INVOCATION_FAILED crashes on Vercel
    console.error("Route Sense middleware safe fallback:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image, _next/data
     * - favicon.ico, manifest, robots, sitemap
     * - login and public auth pages
     * - public auth api routes (/api/v1/auth)
     * - images
     */
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|robots\\.txt|sitemap\\.xml|login|auth|api/v1/auth|images).*)"
  ]
};
