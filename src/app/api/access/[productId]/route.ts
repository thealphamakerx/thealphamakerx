import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPurchasedProduct } from "@/lib/orders";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/access/[productId]">
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { productId } = await params;

  const owns = await hasPurchasedProduct(session.user.id, productId);
  if (!owns) {
    return NextResponse.json({ error: "You haven't purchased this product" }, { status: 403 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.digitalFileKey) {
    const url = await getSignedDownloadUrl(product.digitalFileKey, product.digitalFileName);
    return NextResponse.redirect(url);
  }

  if (product.digitalAccessUrl) {
    return NextResponse.redirect(product.digitalAccessUrl);
  }

  return NextResponse.json({ error: "No file uploaded for this product yet" }, { status: 404 });
}
