import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { deliverEmails, queueCheckoutReminders } from "@/lib/emails";

/** "Send due emails now": queue due reminders and send what's waiting, without waiting for the scheduler. */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const reminders = await queueCheckoutReminders();
  const sent = await deliverEmails(20);
  return NextResponse.json({ reminders, sent });
}
