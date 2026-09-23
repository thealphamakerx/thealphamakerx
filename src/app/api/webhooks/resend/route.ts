import { NextRequest, NextResponse } from "next/server";
import { applyResendEvent, verifyResendWebhook } from "@/lib/emails";

/** Delivery updates from Resend (delivered, bounced, complained…), signed with Svix. */
export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!verifyResendWebhook(body, request.headers)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  try {
    await applyResendEvent(JSON.parse(body));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend webhook not applied", error instanceof Error ? error.message : error);
    // 500 makes Resend retry later.
    return NextResponse.json({ error: "Not processed" }, { status: 500 });
  }
}
