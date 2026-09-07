import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const { amount, currency = "INR" } = await request.json();

  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: `receipt_${Date.now()}`,
  });

  return NextResponse.json(order);
}
