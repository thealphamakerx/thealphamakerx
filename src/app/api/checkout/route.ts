import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCartSummary } from "@/lib/cart";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createCheckoutToken } from "@/lib/payments/access";
import { z } from "zod";
import { VISITOR_ID_RE } from "@/lib/tracking";

// There are no customer accounts: every order belongs to the buyer's email.
export async function POST(request: NextRequest) {
  const parsed = z.object({
    email: z.string().trim().toLowerCase().pipe(z.string().email().max(254)),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    offerId: z.string().min(1).max(100).optional(),
    productIds: z.array(z.string().min(1).max(100)).max(50),
    // Landing page slug the buyer came from, for sales-by-source reporting.
    source: z.string().max(100).optional(),
    visitorId: z.string().regex(VISITOR_ID_RE).optional(),
    utm_source: z.string().trim().max(150).optional(),
    utm_medium: z.string().trim().max(150).optional(),
    utm_campaign: z.string().trim().max(150).optional(),
    utm_content: z.string().trim().max(150).optional(),
    couponCode: z.string().max(100).optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and 10-digit Indian mobile number." }, { status: 400 });
  const body = parsed.data;

  const limit = rateLimit(`checkout:${getClientIp(request)}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts, please slow down" }, { status: 429 });
  }

  const userId = `guest:${body.email}`;
  const [summary, landing] = await Promise.all([
    getCartSummary({ offerId: body.offerId, productIds: body.productIds }, {
      couponCode: body.couponCode,
      userId,
    }),
    body.source ? db.orm.public.LandingPage.first({ slug: body.source }) : null,
  ]);
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
      source: landing?.slug ?? undefined,
      // Attribution only counts alongside a real landing page.
      ...(landing ? {
        visitorId: body.visitorId,
        utmSource: body.utm_source,
        utmMedium: body.utm_medium,
        utmCampaign: body.utm_campaign,
        utmContent: body.utm_content,
      } : {}),
    });

    for (const item of summary.orderItems) {
      await tx.orm.public.OrderItem.create({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        quantity: 1,
        unitPrice: item.unitPrice,
        finalPrice: item.finalPrice,
        offerId: item.offerId ?? undefined,
        offerName: item.offerName ?? undefined,
      });
    }

    return newOrder;
  });

  return NextResponse.json({ orderId: order.id, total: summary.total, checkoutToken: createCheckoutToken(order.id) });
}
