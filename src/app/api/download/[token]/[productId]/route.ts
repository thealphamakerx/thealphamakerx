import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { getProductDownloadUrl } from "@/lib/storage";

// Public — no session required. The token (HMAC over an orderId) is the
// bearer credential guest buyers use instead of an account. Every request
// still re-verifies the order is PAID, so a leaked link is only ever as
// good as the order behind it.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[token]/[productId]">
) {
  const { token, productId } = await params;

  const orderId = verifyOrderAccessToken(token);
  if (!orderId) {
    return NextResponse.json({ error: "Invalid or broken link" }, { status: 403 });
  }

  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order || order.status !== "PAID") {
    return NextResponse.json({ error: "Order not found or not paid" }, { status: 403 });
  }

  const item = await db.orm.public.OrderItem.first({ orderId, productId });
  if (!item) {
    return NextResponse.json({ error: "That product isn't part of this order" }, { status: 403 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const url = await getProductDownloadUrl(product);
  if (!url) {
    return NextResponse.json({ error: "No file uploaded for this product yet" }, { status: 404 });
  }

  return NextResponse.redirect(url);
}
