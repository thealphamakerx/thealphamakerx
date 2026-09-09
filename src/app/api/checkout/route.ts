import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartSummary } from "@/lib/cart";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const body = await request.json();

  let userId: string;
  let email: string | null;

  if (session) {
    userId = session.user.id;
    email = session.user.email;
  } else {
    const guestEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(guestEmail)) {
      return NextResponse.json(
        { error: "A valid email is required to check out as a guest" },
        { status: 400 }
      );
    }
    userId = `guest:${guestEmail}`;
    email = guestEmail;
  }

  const rateLimitKey = session ? session.user.id : getClientIp(request);
  const limit = rateLimit(`checkout:${rateLimitKey}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts, please slow down" }, { status: 429 });
  }

  const items: CartItem[] = body.items ?? [];

  const summary = await getCartSummary(items, {
    couponCode: body.couponCode,
    userId,
  });
  if (summary.lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const order = await db.transaction(async (tx) => {
    const newOrder = await tx.orm.public.Order.create({
      userId,
      email,
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
