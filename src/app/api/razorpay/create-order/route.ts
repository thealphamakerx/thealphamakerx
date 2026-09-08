import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { orderId } = await request.json();

  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order || order.userId !== session.user.id) {
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
