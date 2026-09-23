import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCartSummary } from "@/lib/cart";

// Price preview for the checkout page. Coupons are scoped per buyer email,
// matching the userId the checkout route stores on the order.
export async function POST(request: NextRequest) {
  const parsed = z.object({
    offerId: z.string().min(1).max(100).optional(),
    productIds: z.array(z.string().min(1).max(100)).max(50),
    couponCode: z.string().max(100).optional(),
    email: z.string().email().max(254).optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { offerId, productIds, couponCode, email } = parsed.data;
  const summary = await getCartSummary({ offerId, productIds }, {
    couponCode,
    userId: email ? `guest:${email.trim().toLowerCase()}` : undefined,
  });

  if (couponCode && !email && !summary.couponError) {
    summary.couponError = "Enter your email to apply a coupon";
  }

  // orderItems is the internal per-product split; the preview only needs the lines.
  return NextResponse.json({ ...summary, orderItems: undefined });
}
