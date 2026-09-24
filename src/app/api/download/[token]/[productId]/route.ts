import { NextResponse } from "next/server";
import { authorizeDownload } from "@/lib/downloads";

// Public — no login. The token in the path is the buyer's order link (sent to
// the order's email); authorizeDownload re-checks the order, payment and
// purchase on every request before minting a 15-minute R2 URL.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[token]/[productId]">
) {
  const { token, productId } = await params;

  const result = await authorizeDownload(token, productId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.redirect(result.url);
  // The signed URL must not be cached or leaked to the file host via Referer.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
