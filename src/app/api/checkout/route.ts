import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCartSummary } from "@/lib/cart";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createCheckoutToken } from "@/lib/payments/access";
import { z } from "zod";

// There are no customer accounts: every order belongs to the buyer's email.
export async function POST(request: NextRequest) {
  const parsed = z.object({
    email: z.string().trim().toLowerCase().pipe(z.string().email().max(254)),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    productIds: z.array(z.string().min(1).max(100)).min(1).max(50),
    couponCode: z.string().max(100).optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and 10-digit Indian mobile number." }, { status: 400 });
  const body = parsed.data;

  const limit = rateLimit(`checkout:${getClientIp(request)}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts, please slow down" }, { status: 429 });
  }

  const userId = `guest:${body.email}`;
  const summary = await getCartSummary(body.productIds, {
    couponCode: body.couponCode,
    userId,
  });
  if (summary.lines.length === 0) {
    return NextResponse.json({ error: "This product is no longer available" }, { status: 400 });
  }

  const order = await db.transaction(async (tx) => {
    const newOrder = await tx.orm.public.Order.create({
      userId,
      email: body.email,
      customerPhone: body.phone,
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

  return NextResponse.json({ orderId: order.id, total: summary.total, checkoutToken: createCheckoutToken(order.id) });
}
