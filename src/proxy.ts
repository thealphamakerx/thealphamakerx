import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isMainHost, normalizeDomain } from "@/lib/hosts";

// A landing-page domain serves only the page itself and its tracking endpoint.
// Buying, orders, legal pages and the shop all live on the main store, so
// payments only ever run on the main (Cashfree-whitelisted) domain.
const LANDING_PATHS = ["/api/track"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";

  if (host && !isMainHost(host)) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/lp/domain/${encodeURIComponent(normalizeDomain(host))}`;
      return NextResponse.rewrite(url);
    }
    if (!LANDING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      // Anything else (checkout, shop, admin…) lives on the main store.
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thealphamakerx.in";
      return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, site));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

// Only admins sign in. Buyers have no accounts: checkout takes an email, and
// the confirmation/orders/download pages enforce access with signed tokens.
// Runs on every page so landing-page domains can be routed; static assets skip it.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?)$).*)"],
};
