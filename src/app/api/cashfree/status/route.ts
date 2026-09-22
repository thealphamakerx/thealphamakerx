import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessOrder } from "@/lib/payments/access";
import { reconcilePayment, deliverPaymentEmails } from "@/lib/payments/service";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimit(`cashfree-status:${getClientIp(request)}`, { windowMs: 60_000, max: 30 }).allowed) return NextResponse.json({ error: "Please wait before checking again." }, { status: 429 });
  const { orderId } = await request.json().catch(() => ({}));
  if (typeof orderId !== "string") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const [session, order] = await Promise.all([auth.api.getSession({ headers: request.headers }), db.orm.public.Order.first({ id: orderId })]);
  if (!order || !canAccessOrder(order, session?.user.id, request.headers.get("x-checkout-token"))) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  try {
    const updated = order.cashfreeOrderId ? await reconcilePayment(order.id) : order;
    after(() => deliverPaymentEmails());
    return NextResponse.json({ status: updated.status, paymentStatus: updated.paymentStatus }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Payment status is temporarily unavailable. This does not mean your payment failed." }, { status: 503 });
  }
}
