import { createHash } from "node:crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { verifyCashfreeSignature } from "@/lib/cashfree";
import { db } from "@/lib/db";
import { reconcilePayment, deliverPaymentEmails } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  if (!process.env.CASHFREE_SECRET_KEY) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 256_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifyCashfreeSignature(raw, request.headers.get("x-webhook-timestamp") ?? "", request.headers.get("x-webhook-signature") ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof event?.type !== "string") return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  if (!event.type.startsWith("PAYMENT_") && !event.type.startsWith("REFUND_") && event.type !== "AUTO_REFUND_STATUS_WEBHOOK") return NextResponse.json({ received: true, ignored: true });
  const gatewayId = event.data?.order?.order_id ?? event.data?.refund?.order_id ?? event.data?.auto_refund?.order_id ?? event.data?.order_id;
  if (typeof gatewayId !== "string") return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  const order = await db.orm.public.Order.first({ cashfreeOrderId: gatewayId });
  if (!order) return NextResponse.json({ error: "Order not available yet" }, { status: 503 });
  const id = createHash("sha256").update(raw).digest("hex");
  try {
    if (!(await db.orm.public.PaymentEvent.first({ id }))) {
      await reconcilePayment(order.id, { id, type: event.type, source: "webhook",
        refundId: event.data?.refund?.refund_id ?? (event.data?.auto_refund?.cf_refund_id ? `auto_${event.data.auto_refund.cf_refund_id}` : undefined),
        refundStatus: event.data?.refund?.refund_status ?? event.data?.auto_refund?.refund_status,
      });
    }
    after(() => deliverPaymentEmails());
    return NextResponse.json({ received: true });
  } catch {
    console.error(`Cashfree webhook retry required for order ${order.id}, event ${id}`);
    return NextResponse.json({ error: "Retry required" }, { status: 503 });
  }
}
