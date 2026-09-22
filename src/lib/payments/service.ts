import { z } from "zod";
import { randomUUID } from "node:crypto";
import { cashfreeEnvironment, cashfreeRequest, cashfreeRefundSchema, fetchCashfreeSnapshot } from "@/lib/cashfree";
import { paymentPool, paymentTransaction } from "./pool";
import { applyPaymentSnapshot } from "./store";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "@/lib/email";
import { createOrderAccessToken } from "@/lib/order-token";
import { siteConfig } from "@/config/site";

export async function reconcilePayment(orderId: string, event: { id: string; type: string; source: string; refundId?: string; refundStatus?: string } = { id: randomUUID(), type: "STATUS_SYNC", source: "poll" }) {
  const { rows: [order] } = await paymentPool.query('SELECT * FROM public."order" WHERE id=$1', [orderId]);
  if (!order?.cashfreeOrderId) return order;
  if (order.paymentEnvironment !== cashfreeEnvironment()) throw new Error("Payment environment mismatch");
  const snapshot = await fetchCashfreeSnapshot(order.cashfreeOrderId);
  // A SUCCESS notification may reach us before the read API catches up. Ask Cashfree to retry.
  if (event.type === "PAYMENT_SUCCESS_WEBHOOK" && !snapshot.payments.some((p) => p.payment_status === "SUCCESS")) throw new Error("Payment confirmation not available yet");
  if (event.refundId && !snapshot.refunds.some((r) => r.refund_id === event.refundId && r.refund_status === event.refundStatus)) throw new Error("Refund confirmation not available yet");
  const updated = await paymentTransaction((client) => applyPaymentSnapshot(client, orderId, snapshot, event));
  return updated;
}

export async function confirmFreePayment(orderId: string) {
  return paymentTransaction(async (client) => {
    const { rows: [order] } = await client.query('SELECT * FROM public."order" WHERE id=$1 FOR UPDATE', [orderId]);
    if (!order || order.total !== 0 || order.status !== "PENDING") throw new Error("Order is not a pending free order");
    await client.query('UPDATE public."order" SET status=\'PAID\',"paymentStatus"=\'SUCCESS\',"updatedAt"=now() WHERE id=$1', [orderId]);
    await client.query('INSERT INTO public."paymentEmail" (id,"orderId",kind) VALUES ($1,$2,\'PAID\') ON CONFLICT DO NOTHING', [`paid:${orderId}`, orderId]);
  });
}

export async function deliverPaymentEmails(limit = 5) {
  for (let index = 0; index < limit; index++) {
    const processed = await paymentTransaction(async (client) => {
      const { rows: [email] } = await client.query(`SELECT * FROM public."paymentEmail" WHERE "sentAt" IS NULL
        ORDER BY attempts,"createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED`);
      if (!email) return false;
      const { rows: [order] } = await client.query('SELECT * FROM public."order" WHERE id=$1', [email.orderId]);
      // A subsequently refunded order must not receive a stale access notification.
      if (email.kind === "PAID" && order.status !== "PAID") {
        await client.query('UPDATE public."paymentEmail" SET "sentAt"=now() WHERE id=$1', [email.id]);
        return true;
      }
      try {
        if (!order.email) throw new Error("Buyer email is missing");
        if (email.kind === "PAID") {
          await sendOrderConfirmationEmail({ to: order.email, orderId: order.id, total: order.total,
            downloadUrl: `${siteConfig.url}/download/${createOrderAccessToken(order.id)}`, idempotencyKey: email.id });
        } else {
          await sendOrderStatusEmail({ to: order.email, orderId: order.id, status: email.kind, idempotencyKey: email.id });
        }
        await client.query('UPDATE public."paymentEmail" SET "sentAt"=now(),attempts=attempts+1 WHERE id=$1', [email.id]);
      } catch {
        await client.query('UPDATE public."paymentEmail" SET attempts=attempts+1 WHERE id=$1', [email.id]);
        console.error(`Payment notification pending for order ${order.id}`);
        return false;
      }
      return true;
    });
    if (!processed) break;
  }
}

export async function requestFullRefund(orderId: string, actorUserId: string) {
  await reconcilePayment(orderId, { id: randomUUID(), type: "PRE_REFUND_SYNC", source: "admin" });
  const refund = await paymentTransaction(async (client) => {
    const { rows: [order] } = await client.query('SELECT * FROM public."order" WHERE id=$1 FOR UPDATE', [orderId]);
    if (!order || order.status !== "PAID" || !order.cashfreePaymentId || order.total <= 0 || order.refundedAmount > 0) throw new Error("Order is not eligible for a full refund");
    const { rows: [existing] } = await client.query('SELECT * FROM public."paymentRefund" WHERE "orderId"=$1 LIMIT 1', [orderId]);
    if (existing) throw new Error("A refund already exists. Sync its status or manage it in Cashfree.");
    const id = randomUUID();
    await client.query('INSERT INTO public."paymentRefund" (id,"orderId",amount,status,"paymentId","updatedAt") VALUES ($1,$2,$3,\'REQUESTED\',$4,now())', [id, orderId, order.total, order.cashfreePaymentId]);
    await client.query('UPDATE public."order" SET "paymentStatus"=\'REFUND_PENDING\',"updatedAt"=now() WHERE id=$1', [orderId]);
    await client.query('INSERT INTO public."paymentEvent" (id,"orderId",type,source,summary) VALUES ($1,$2,\'REFUND_REQUESTED\',\'admin\',$3)', [randomUUID(), orderId, JSON.stringify({ actorUserId, refundId: id, amount: order.total })]);
    return { id, orderId, cashfreeOrderId: order.cashfreeOrderId, amount: order.total };
  });
  // Persist before sending. If a timeout/crash occurs, the scheduled job retries this exact ID.
  await submitRefund(refund);
}

async function submitRefund(refund: { id: string; orderId: string; cashfreeOrderId: string; amount: number }) {
  await cashfreeRequest(`/orders/${encodeURIComponent(refund.cashfreeOrderId)}/refunds`, z.union([cashfreeRefundSchema, z.array(cashfreeRefundSchema)]), {
    refund_id: refund.id, refund_amount: refund.amount / 100, refund_note: "Customer support refund", refund_speed: "STANDARD",
  }, refund.id);
  await reconcilePayment(refund.orderId, { id: randomUUID(), type: "REFUND_SYNC", source: "admin" });
}

export async function reconcileOutstandingPayments() {
  const { rows } = await paymentPool.query(`SELECT id FROM public."order" WHERE "cashfreeOrderId" IS NOT NULL
    AND "paymentEnvironment"=$1 AND (status='PENDING' OR "paymentStatus"='REFUND_PENDING' OR
      (status='PAID' AND "createdAt">now()-interval '180 days'))
    ORDER BY "lastPaymentSyncAt" NULLS FIRST LIMIT 25`, [cashfreeEnvironment()]);
  let failed = 0;
  for (const order of rows) {
    try {
      await reconcilePayment(order.id, { id: randomUUID(), type: "SCHEDULED_SYNC", source: "cron" });
      const { rows: refunds } = await paymentPool.query(`SELECT r.*,o."cashfreeOrderId" FROM public."paymentRefund" r JOIN public."order" o ON o.id=r."orderId" WHERE r."orderId"=$1 AND r.status='REQUESTED'`, [order.id]);
      for (const refund of refunds) await submitRefund(refund);
    } catch { failed++; console.error(`Payment reconciliation pending for order ${order.id}`); }
  }
  await deliverPaymentEmails();
  return { checked: rows.length, failed };
}
