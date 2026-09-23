import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Only admins sign in. Buyers have no accounts: checkout takes an email, and
// the confirmation/orders/download pages enforce access with signed tokens.
export const config = {
  matcher: ["/admin/:path*"],
};
