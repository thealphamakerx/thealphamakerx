import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";
import { confirmFreeOrder } from "@/lib/orders";

// Razorpay rejects orders below ₹1.
const MIN_CHARGE_PAISE = 100;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  const { orderId } = await request.json().catch(() => ({}));
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Signed-in orders are owned by the session; guest orders have no
  // account to check against, so the orderId itself — a UUID minted
  // server-side and only ever handed to the browser that created it —
  // is the bearer credential, same trust model as the guest download
  // token.
  const isOwner = session ? order.userId === session.user.id : order.userId.startsWith("guest:");
  if (!isOwner) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Order is not payable" }, { status: 409 });
  }

  if (order.total === 0) {
    await confirmFreeOrder(order.id);
    return NextResponse.json({ free: true });
  }
  if (order.total < MIN_CHARGE_PAISE) {
    return NextResponse.json(
      { error: "Order total is below the minimum payable amount of ₹1" },
      { status: 400 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("Razorpay keys are not configured");
    return NextResponse.json({ error: "Payments are not available right now" }, { status: 503 });
  }

  // Retrying payment on the same order reuses its Razorpay order, so a
  // payment captured on an earlier attempt still matches this order when
  // the webhook arrives.
  if (order.razorpayOrderId) {
    return NextResponse.json({
      keyId,
      razorpayOrderId: order.razorpayOrderId,
      amount: order.total,
      currency: "INR",
    });
  }

  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpay().orders.create({
      amount: order.total,
      currency: "INR",
      receipt: order.id,
    });
  } catch (error) {
    console.error(`Order ${order.id}: Razorpay order creation failed`, error);
    return NextResponse.json(
      { error: "Could not reach the payment gateway, please try again" },
      { status: 502 }
    );
  }

  await db.orm.public.Order
    .where({ id: order.id })
    .update({ razorpayOrderId: razorpayOrder.id });

  return NextResponse.json({
    keyId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  });
}
