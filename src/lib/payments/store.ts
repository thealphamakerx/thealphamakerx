import type { PoolClient } from "pg";
import { paise, paymentState, validateSnapshot, type PaymentSnapshot } from "./state";
import { queueEmail, queuePaymentFailedEmail } from "@/lib/emails";

// Payment outcomes that leave an order unpaid but still payable.
const UNPAID_OUTCOMES = new Set(["FAILED", "USER_DROPPED", "CANCELLED", "VOID"]);

// The caller owns the transaction. Row locking serializes webhook, polling and admin updates.
export async function applyPaymentSnapshot(client: Pick<PoolClient, "query">, orderId: string, snapshot: PaymentSnapshot, event: { id: string; type: string; source: string }) {
  const { rows: [order] } = await client.query('SELECT * FROM public."order" WHERE id = $1 FOR UPDATE', [orderId]);
  if (!order) throw new Error("Order not found");
  validateSnapshot(snapshot, order);
  const receipt = await client.query('INSERT INTO public."paymentEvent" (id, "orderId", type, source, summary) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING RETURNING id',
    [event.id, orderId, event.type, event.source, JSON.stringify({ gatewayStatus: snapshot.order.order_status, attempts: snapshot.payments.length, refunds: snapshot.refunds.length })]);
  if (!receipt.rows.length) return order;

  for (const payment of snapshot.payments) {
    await client.query(`INSERT INTO public."paymentAttempt" (id,"orderId",status,amount,currency,message,"paymentTime","updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,
      message=EXCLUDED.message,"updatedAt"=now()
      WHERE "paymentAttempt"."orderId"=EXCLUDED."orderId" AND "paymentAttempt".status <> 'SUCCESS'
      AND (EXCLUDED.status='SUCCESS' OR "paymentAttempt".status IN ('PENDING','NOT_ATTEMPTED'))`,
      [payment.cf_payment_id, orderId, payment.payment_status, paise(payment.payment_amount), payment.payment_currency, payment.payment_message?.slice(0, 500) ?? null, payment.payment_time]);
  }
  for (const refund of snapshot.refunds) {
    await client.query(`INSERT INTO public."paymentRefund" (id,"orderId",amount,status,"gatewayRefundId",message,"paymentId","refundType","updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,
      "gatewayRefundId"=EXCLUDED."gatewayRefundId",message=EXCLUDED.message,"paymentId"=EXCLUDED."paymentId","refundType"=EXCLUDED."refundType","updatedAt"=now()
      WHERE "paymentRefund"."orderId"=EXCLUDED."orderId" AND "paymentRefund".status <> 'SUCCESS'
      AND (EXCLUDED.status='SUCCESS' OR "paymentRefund".status IN ('REQUESTED','PENDING','PENDING_APPROVAL','ONHOLD','UNKNOWN'))`,
      [refund.refund_id, orderId, paise(refund.refund_amount), refund.refund_status, refund.cf_refund_id ?? null, refund.status_description?.slice(0, 500) ?? null, refund.cf_payment_id ?? null, refund.refund_type ?? "MERCHANT_INITIATED"]);
  }
  const { rows: attempts } = await client.query('SELECT * FROM public."paymentAttempt" WHERE "orderId"=$1 ORDER BY "paymentTime" DESC,id DESC', [orderId]);
  const { rows: refunds } = await client.query('SELECT * FROM public."paymentRefund" WHERE "orderId"=$1', [orderId]);
  const successful = attempts.find((p) => p.status === "SUCCESS");
  const settledPaymentId = order.cashfreePaymentId ?? successful?.id;
  // Auto-refunds for another failed/duplicate attempt must not revoke a valid purchase.
  const purchaseRefunds = refunds.filter((r) => r.paymentId ? r.paymentId === settledPaymentId : r.refundType !== "PAYMENT_AUTO_REFUND");
  const state = paymentState(snapshot.order.order_status, attempts, purchaseRefunds, order.total);
  let status = order.status;
  if (successful && status === "PENDING") status = "PAID";
  if (successful && status === "CANCELLED") state.paymentStatus = "REVIEW_REQUIRED";
  if (state.paymentStatus === "REFUNDED") status = "REFUNDED";
  if (order.status === "REFUNDED") { status = "REFUNDED"; state.paymentStatus = "REFUNDED"; }
  // Multiple successful attempts need manual review; never silently ignore a second charge.
  if (attempts.filter((p) => p.status === "SUCCESS").length > 1) state.paymentStatus = "REVIEW_REQUIRED";
  const { rows: [updated] } = await client.query(`UPDATE public."order" SET status=$2,"paymentStatus"=$3,
    "cashfreePaymentId"=COALESCE("cashfreePaymentId",$4),"refundedAmount"=$5,"lastPaymentSyncAt"=now(),"updatedAt"=now()
    WHERE id=$1 RETURNING *`, [orderId, status, state.paymentStatus, successful?.id ?? null, state.refundedAmount]);
  // Emails are queued in this same transaction, so they exist exactly when the change commits.
  if (status === "PAID" && order.status === "PENDING") {
    await queueEmail(client, `paid:${orderId}`, orderId, "PAID");
    await queueEmail(client, `admin-sale:${orderId}`, orderId, "ADMIN_NEW_SALE");
  }
  if (status === "REFUNDED" && order.status !== "REFUNDED") {
    await queueEmail(client, `refunded:${orderId}`, orderId, "REFUNDED");
  }
  if (status === "PENDING" && UNPAID_OUTCOMES.has(state.paymentStatus) && order.paymentStatus !== state.paymentStatus) {
    await queuePaymentFailedEmail(client, orderId);
  }
  return updated;
}
