import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  const { orderId } = await request.json();

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

  const razorpayOrder = await getRazorpay().orders.create({
    amount: order.total,
    currency: "INR",
    receipt: order.id,
  });

  await db.orm.public.Order
    .where({ id: order.id })
    .update({ razorpayOrderId: razorpayOrder.id });

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  });
}
