import { timingSafeEqual } from "node:crypto";
import { reconcileOutstandingPayments } from "@/lib/payments/service";

// Scheduled job: sync pending payments, queue checkout reminders, send due emails.
// Vercel Cron calls it with "Authorization: Bearer $CRON_SECRET"; any other
// scheduler can too (PAYMENT_RECONCILE_SECRET is also accepted).
function authorised(request: Request) {
  const token = request.headers.get("authorization") ?? "";
  return [process.env.CRON_SECRET, process.env.PAYMENT_RECONCILE_SECRET].some((secret) => {
    if (!secret) return false;
    const expected = `Bearer ${secret}`;
    return Buffer.byteLength(token) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  });
}

export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await reconcileOutstandingPayments());
}

export const POST = GET;
