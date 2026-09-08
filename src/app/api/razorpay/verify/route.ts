import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { confirmOrderPayment } from "@/lib/orders";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`razorpay-verify:${getClientIp(request)}`, {
    windowMs: 60_000,
    max: 20,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

  const isValid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Fast-path confirmation for immediate UX; the webhook is the source of
  // truth and applies the same idempotent transition independently.
  const { order } = await confirmOrderPayment({
    razorpayOrderId,
    paymentId: razorpayPaymentId,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ verified: true, orderId: order.id });
}
