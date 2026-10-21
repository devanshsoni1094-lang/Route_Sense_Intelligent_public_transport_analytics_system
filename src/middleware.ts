import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow static files, Next.js internal chunks, images, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/v1/auth") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public authentication pages
  if (
    pathname === "/login" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/reset-password")
  ) {
    return NextResponse.next();
  }

  // 3. Check for authenticated session token
  const sessionCookie = request.cookies.get("routesense_session")?.value;
  
  // Check for Supabase session cookies (sb-<project>-auth-token or supabase-auth-token)
  let hasSupabaseSession = false;
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes("auth-token") && cookie.value) {
      hasSupabaseSession = true;
    }
  });

  const isAuthenticated = Boolean(sessionCookie || hasSupabaseSession);

  // 4. If unauthenticated, redirect to login page with return path
  if (!isAuthenticated) {
    // If request is an API call, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required to access this endpoint." },
        { status: 401 }
      );
    }

    const redirectUrl = new URL("/login", request.url);
    const destination = pathname + search;
    if (destination !== "/") {
      redirectUrl.searchParams.set("redirect", destination);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
