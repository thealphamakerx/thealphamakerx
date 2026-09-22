import type { CashfreeOrder, CashfreePayment, CashfreeRefund } from "../cashfree";

export type PaymentSnapshot = { order: CashfreeOrder; payments: CashfreePayment[]; refunds: CashfreeRefund[] };
export function paise(amount: number) {
  const rounded = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(rounded) || Math.abs(amount * 100 - rounded) > 0.0001) {
    throw new Error("Invalid gateway amount");
  }
  return rounded;
}

export function validateSnapshot(snapshot: PaymentSnapshot, order: { cashfreeOrderId: string | null; total: number }) {
  if (snapshot.order.order_id !== order.cashfreeOrderId || snapshot.order.order_currency !== "INR" || paise(snapshot.order.order_amount) !== order.total) {
    throw new Error("Gateway order does not match the local order");
  }
  for (const payment of snapshot.payments) {
    if (payment.order_id !== order.cashfreeOrderId || payment.order_currency !== "INR" || paise(payment.order_amount) !== order.total || !Number.isFinite(Date.parse(payment.payment_time))) {
      throw new Error("Gateway payment does not match the local order");
    }
    // This integration accepts INR without gateway-funded offers or partial captures.
    if (payment.payment_status === "SUCCESS" && (payment.payment_currency !== "INR" || paise(payment.payment_amount) !== order.total || payment.is_captured === false)) {
      throw new Error("Successful payment amount, currency or capture does not match");
    }
  }
  for (const refund of snapshot.refunds) {
    if (refund.order_id !== order.cashfreeOrderId || refund.refund_currency !== "INR" || paise(refund.refund_amount) > order.total) throw new Error("Refund does not match order");
  }
}

export function paymentState(gatewayStatus: string, attempts: { status: string }[], refunds: { status: string; amount: number }[], total: number) {
  const successful = attempts.some((p) => p.status === "SUCCESS");
  const refunded = refunds.filter((r) => r.status === "SUCCESS").reduce((sum, r) => sum + r.amount, 0);
  if (refunded > total) return { paymentStatus: "REVIEW_REQUIRED", refundedAmount: refunded };
  if (successful) {
    if (total > 0 && refunded === total) return { paymentStatus: "REFUNDED", refundedAmount: refunded };
    if (refunds.some((r) => ["PENDING", "PENDING_APPROVAL", "REQUESTED", "ONHOLD", "UNKNOWN"].includes(r.status))) return { paymentStatus: "REFUND_PENDING", refundedAmount: refunded };
    return { paymentStatus: refunded > 0 ? "PARTIALLY_REFUNDED" : "SUCCESS", refundedAmount: refunded };
  }
  if (gatewayStatus === "PAID") return { paymentStatus: "PENDING", refundedAmount: 0 }; // Await matching successful attempt.
  if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(gatewayStatus)) return { paymentStatus: gatewayStatus, refundedAmount: 0 };
  if (attempts.some((p) => ["PENDING", "NOT_ATTEMPTED"].includes(p.status))) return { paymentStatus: "PENDING", refundedAmount: 0 };
  return { paymentStatus: attempts[0]?.status ?? "ACTIVE", refundedAmount: 0 };
}
