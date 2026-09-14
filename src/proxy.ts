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

// /checkout is deliberately not gated: guests can buy with just an email, and
// the checkout/confirmation pages enforce order ownership themselves.
export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
