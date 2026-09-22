import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentTransaction } from "@/lib/payments/pool";
import { requestFullRefund, reconcilePayment, deliverPaymentEmails } from "@/lib/payments/service";
import { randomUUID } from "node:crypto";

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action } = await request.json().catch(() => ({}));
  const order = await db.orm.public.Order.first({ id });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  try {
    if (action === "sync") {
      await reconcilePayment(id, { id: randomUUID(), type: "ADMIN_SYNC", source: "admin" });
    } else if (action === "refund") {
      await requestFullRefund(id, session.user.id);
    } else if (action === "cancel") {
      // An active gateway session may still succeed. Only cancel orders that cannot take payment.
      if (order.cashfreeOrderId) await reconcilePayment(id);
      await paymentTransaction(async (client) => {
        const result = await client.query(`UPDATE public."order" SET status='CANCELLED',"updatedAt"=now() WHERE id=$1 AND status='PENDING'
          AND ("cashfreeOrderId" IS NULL OR "paymentStatus" IN ('EXPIRED','TERMINATED')) RETURNING id`, [id]);
        if (!result.rows.length) throw new Error("Active or paid orders cannot be cancelled here. Wait for the gateway session to close, or refund a confirmed payment.");
        await client.query('INSERT INTO public."paymentEvent" (id,"orderId",type,source,summary) VALUES ($1,$2,\'ORDER_CANCELLED\',\'admin\',$3)', [randomUUID(), id, JSON.stringify({ actorUserId: session.user.id })]);
      });
    } else return NextResponse.json({ error: "Choose sync, refund or cancel. Payment success cannot be set manually." }, { status: 400 });
    after(() => deliverPaymentEmails());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: action === "refund" ? "Refund not completed. Sync the status before retrying; an accepted request may still be processing." : error instanceof Error ? error.message : "Unable to update order" }, { status: 409 });
  }
}
