import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  const { orderId, paymentId, signature } = await request.json();

  const isValid = verifyPaymentSignature({ orderId, paymentId, signature });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
