import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessOrder, createCheckoutToken } from "@/lib/payments/access";
import { cashfreeConfigured, cashfreeEnvironment, cashfreeRequest, cashfreeOrderSchema, CashfreeError, paymentOrigin } from "@/lib/cashfree";
import { confirmFreePayment, deliverPaymentEmails, reconcilePayment } from "@/lib/payments/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimit(`cashfree-create:${getClientIp(request)}`, { windowMs: 60_000, max: 10 }).allowed) return NextResponse.json({ error: "Please wait before retrying." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.orderId !== "string") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const session = await auth.api.getSession({ headers: request.headers });
  const order = await db.orm.public.Order.first({ id: body.orderId });
  if (!order || !canAccessOrder(order, session?.user.id, request.headers.get("x-checkout-token"))) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "PAID") return NextResponse.json({ paid: true });
  if (order.status !== "PENDING") return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
  if (order.total === 0) {
    await confirmFreePayment(order.id);
    after(() => deliverPaymentEmails());
    return NextResponse.json({ paid: true });
  }
  if (order.total < 100) return NextResponse.json({ error: "The minimum payment is ₹1." }, { status: 400 });
  if (!cashfreeConfigured()) return NextResponse.json({ error: "Payments are being set up. Please try again later." }, { status: 503 });
  if (!order.customerPhone) return NextResponse.json({ error: "Please start checkout again and enter your mobile number." }, { status: 409 });
  const customerName = typeof body.customerName === "string" ? body.customerName.replace(/[^\p{L}\p{M} .'-]/gu, "").trim().slice(0, 100) : "";
  try {
    const mode = cashfreeEnvironment();
    if (order.paymentEnvironment && order.paymentEnvironment !== mode) return NextResponse.json({ error: "Please start a new checkout." }, { status: 409 });
    const returnOrigin = paymentOrigin("return");
    const webhookOrigin = paymentOrigin("webhook");
    const gatewayOrderId = `cf_${order.id}`;
    // Record the deterministic ID before contacting the gateway so even a very early webhook maps back.
    const reserved = await db.orm.public.Order.where({ id: order.id, status: "PENDING" }).update({ cashfreeOrderId: gatewayOrderId, paymentEnvironment: mode });
    if (!reserved) return NextResponse.json({ error: "Order status changed. Please check your payment status." }, { status: 409 });
    const path = `/orders/${encodeURIComponent(gatewayOrderId)}`;
    let gateway;
    try { gateway = await cashfreeRequest(path, cashfreeOrderSchema); }
    catch (error) { if (!(error instanceof CashfreeError) || error.status !== 404) throw error; }
    if (!gateway) {
      try {
        gateway = await cashfreeRequest("/orders", cashfreeOrderSchema, {
          order_id: gatewayOrderId, order_amount: order.total / 100, order_currency: "INR",
          customer_details: {
            // Cashfree rejects customer IDs with characters outside [A-Za-z0-9_-] in some API
            // versions; the hex-only form of the UUID is always accepted.
            customer_id: `c_${order.id.replace(/-/g, "")}`, customer_phone: order.customerPhone,
            ...(order.email ? { customer_email: order.email } : {}),
            ...(customerName.length >= 3 ? { customer_name: customerName } : {}),
          },
          order_meta: {
            return_url: `${returnOrigin}/checkout/confirmation?orderId=${order.id}&token=${createCheckoutToken(order.id)}`,
            notify_url: `${webhookOrigin}/api/webhooks/cashfree`,
          },
        }, order.id);
      } catch (error) {
        // Concurrent requests / lost create response reuse the same order; never mint a second gateway order.
        if (!(error instanceof CashfreeError) || error.status !== 409) throw error;
        gateway = await cashfreeRequest(path, cashfreeOrderSchema);
      }
    }
    if (gateway.order_id !== gatewayOrderId || gateway.order_currency !== "INR" || Math.round(gateway.order_amount * 100) !== order.total) throw new Error("Gateway order mismatch");
    if (gateway.order_status === "PAID") {
      await reconcilePayment(order.id);
      after(() => deliverPaymentEmails());
      return NextResponse.json({ checkStatus: true });
    }
    if (gateway.order_status !== "ACTIVE") return NextResponse.json({ error: "This payment session has expired or closed. Please start a new checkout." }, { status: 409 });
    if (!gateway.payment_session_id) throw new Error("Missing payment session");
    await db.orm.public.Order.where({ id: order.id, paymentStatus: "NOT_STARTED" }).update({ paymentStatus: "ACTIVE" });
    return NextResponse.json({ paymentSessionId: gateway.payment_session_id, mode });
  } catch (error) {
    console.error("Cashfree checkout unavailable", {
      orderId: order.id,
      environment: process.env.CASHFREE_ENV,
      status: error instanceof CashfreeError ? error.status : undefined,
      code: error instanceof CashfreeError ? error.code : "checkout_configuration_or_response_error",
      detail: error instanceof CashfreeError ? error.detail : error instanceof Error ? error.message : String(error),
    });
    if (error instanceof CashfreeError && [401, 403].includes(error.status)) {
      return NextResponse.json({ error: "Payments are temporarily unavailable due to a payment configuration issue. Please contact support." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not start payment. Your order is saved; please retry." }, { status: 502 });
  }
}
