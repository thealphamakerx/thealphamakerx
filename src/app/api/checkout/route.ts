import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartSummary } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limit = rateLimit(`checkout:${session.user.id}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts, please slow down" }, { status: 429 });
  }

  const body = await request.json();
  const items: CartItem[] = body.items ?? [];

  const summary = await getCartSummary(items, {
    couponCode: body.couponCode,
    userId: session.user.id,
  });
  if (summary.lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const order = await db.transaction(async (tx) => {
    const newOrder = await tx.orm.public.Order.create({
      userId: session.user.id,
      status: "PENDING",
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      couponCode: summary.couponCode ?? undefined,
      total: summary.total,
    });

    for (const line of summary.lines) {
      await tx.orm.public.OrderItem.create({
        orderId: newOrder.id,
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        finalPrice: line.lineTotal,
      });
    }

    return newOrder;
  });

  return NextResponse.json({ orderId: order.id, total: summary.total });
}
