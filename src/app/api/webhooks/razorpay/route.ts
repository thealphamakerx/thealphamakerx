import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmOrderPayment } from "@/lib/orders";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature({ body, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload.payment.entity;
      await confirmOrderPayment({
        razorpayOrderId: payment.order_id,
        paymentId: payment.id,
      });
      break;
    }
    case "payment.failed":
      // Order stays PENDING — the customer can retry payment on the same order.
      break;
  }

  return NextResponse.json({ received: true });
}
