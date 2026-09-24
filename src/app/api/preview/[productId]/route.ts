import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedDownloadUrl } from "@/lib/storage";

// Public free sample: a product's preview file opens in the browser through a
// short-lived R2 URL, so the bucket itself stays private.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/preview/[productId]">
) {
  const { productId } = await params;

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product?.previewFileKey) {
    return NextResponse.json({ error: "No preview for this product" }, { status: 404 });
  }

  const url = await getSignedDownloadUrl(product.previewFileKey, product.previewFileName, { inline: true });
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
