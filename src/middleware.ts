import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight route protection.
 * Full session validation still happens in page/API handlers.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("nexora_session")?.value;

  // Public routes
  if (
    pathname.startsWith("/owner/login") ||
    pathname.startsWith("/company/login") ||
    pathname.startsWith("/branch/login") ||
    pathname.startsWith("/api/owner/login") ||
    pathname.startsWith("/api/company/login") ||
    pathname.startsWith("/api/branch/login") ||
    pathname.startsWith("/api/webhook") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Everything else expects a session cookie (detailed checks in handlers)
  if (!session && (pathname.startsWith("/owner") || pathname.startsWith("/company") || pathname.startsWith("/branch"))) {
    if (pathname.startsWith("/owner")) {
      return NextResponse.redirect(new URL("/owner/login", req.url));
    }
    if (pathname.startsWith("/company")) {
      return NextResponse.redirect(new URL("/company/login", req.url));
    }
    if (pathname.startsWith("/branch")) {
      return NextResponse.redirect(new URL("/branch/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/company/:path*", "/branch/:path*", "/api/:path*"],
};
