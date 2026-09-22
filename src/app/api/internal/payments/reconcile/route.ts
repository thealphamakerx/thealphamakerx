import { timingSafeEqual } from "node:crypto";
import { reconcileOutstandingPayments } from "@/lib/payments/service";

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_RECONCILE_SECRET;
  const token = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await reconcileOutstandingPayments());
}
